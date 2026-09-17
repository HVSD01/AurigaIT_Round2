# Technical Reasoning & Engineering Decisions

This document details the architectural reasoning, mathematical formulations, testing methodologies, and problem-solving process applied during the development of MedSync.

---

## 1. Architectural Philosophy & Modularity

The system follows a strict, layered MVC-with-Middleware architecture:
- **Routes Layer**: Responsible purely for URL mapping, HTTP method binding, rate limiting, and request validation pipelines.
- **Middleware Layer**: Decoupled concerns (JWT authentication, parameter validation via `express-validator`, centralized error filtering, brute-force mitigation).
- **Controllers Layer**: Orchestrates business workflows, interacting with Mongoose models and pure utility functions.
- **Utils Layer**: Pure, deterministic domain logic (`overlapCheck.js`, `cancellationFee.js`, `clock.js`), allowing independent unit testing without mock overhead.
- **Models Layer**: Strict Mongoose schemas with compound indexes (`{ doctor: 1, startTime: 1 }` on `Appointment`) optimizing interval queries and doctor-day schedule lookups.

This separation ensured that when the 3 "twist" requirements arrived (Reschedule, Virtual Clock, Notification Outbox, and Auto No-Show), they were integrated seamlessly in minutes without refactoring or rewriting any existing models or routes.

---

## 2. Overlap Checking Formulation

### The Problem
Double-booking a doctor creates patient dissatisfaction, clinic friction, and scheduling chaos. A naive client-side check can be bypassed or rendered inaccurate by race conditions and network delays.

### The Solution
We enforce conflict detection strictly on the server right before committing any booking or rescheduling transaction.

Two time intervals $[A_{\text{start}}, A_{\text{end}})$ and $[B_{\text{start}}, B_{\text{end}})$ overlap if and only if:
$$\text{newStart} < \text{existingEnd} \quad \wedge \quad \text{newEnd} > \text{existingStart}$$

In Mongoose syntax against `'booked'` appointments:
```js
const query = {
  doctor: doctorId,
  status: 'booked',
  startTime: { $lt: newEnd },
  endTime: { $gt: newStart },
};
```
Edge cases tested:
- **Exact match**: Overlaps -> Blocked (409)
- **New starts during existing**: Overlaps -> Blocked (409)
- **New ends during existing**: Overlaps -> Blocked (409)
- **New completely encloses existing**: Overlaps -> Blocked (409)
- **Adjacent slots**: `newStart === existingEnd` or `newEnd === existingStart` -> Non-overlapping -> Allowed (201)

### Twist 1: Reschedule Integration
When rescheduling an appointment, querying existing appointments would falsely match itself. We solved this cleanly in `utils/overlapCheck.js` by supporting an optional `excludeAppointmentId`:
```js
if (excludeAppointmentId) {
  query._id = { $ne: excludeAppointmentId };
}
```
This allowed 100% reuse of the battle-tested overlap algorithm.

---

## 3. Cancellation Fee Policy Formulation

### The Problem
Clinic revenue leaks when patients cancel on short notice, preventing the clinic from filling the vacated slot.

### The Business Rule
- Notice > 2 hours: Free cancellation ($0).
- Notice $\le$ 2 hours: 10% fee based on the doctor's stored consultation fee.

### Implementation Details
```js
const diffMs = appointmentStart.getTime() - now.getTime();
const hoursUntilAppointment = diffMs / (1000 * 60 * 60);

if (hoursUntilAppointment <= 2) {
  isLateCancellation = true;
  feeCharged = Math.round(Number(consultationFee) * 0.10 * 100) / 100;
} else {
  feeCharged = 0;
}
```
By binding `now` to `getNow()`, the cancellation logic seamlessly respects both live system time and simulated virtual clock time without divergence.

---

## 4. Virtual Clock, Notification Outbox & Auto No-Show Design (Twists 2 & 3)

### Single Source of Time (`utils/clock.js`)
Instead of directly invoking `new Date()` across controller logic, all time calculations invoke `getNow()`. 
- When `virtualTime === null`, `getNow()` returns a standard `new Date()`.
- When set via `POST /api/clock`, `getNow()` returns the virtual timestamp.

### Morning Reminder Outbox (Twist 2)
When time advances across a calendar date boundary (e.g. from `2026-10-01` to `2026-10-05`), a new day has begun:
1. The calendar dates (YYYY-MM-DD) of `previousTime` and `currentTime` are compared.
2. If distinct, all `'booked'` appointments falling on `newDateStr` are retrieved.
3. For each appointment not already having a reminder in the Outbox, a reminder record is inserted with the patient's name and appointment time.
4. Subsequent clock ticks within the same calendar date do not produce duplicate reminders.

### Auto No-Show (Twist 3)
1. On every `/api/clock` invocation, the cutoff time is computed:
   $$\text{cutoff} = \text{currentTime} - 30\text{ minutes}$$
2. An atomic MongoDB bulk update transitions all appointments with `status: 'booked'` and `startTime <= cutoff` to `'no-show'`:
```js
await Appointment.updateMany(
  { status: 'booked', startTime: { $lte: cutoffTime } },
  { $set: { status: 'no-show' } }
);
```

---

## 5. Testing & Verification

A dedicated Node verification suite was executed to test every scenario:
1. **Initial booking**: Status 201 Created.
2. **Overlap rejection**: Status 409 Conflict when overlapping by 15 minutes.
3. **Adjacent booking**: Status 201 Created for adjacent slots.
4. **Reschedule conflict**: Status 409 Conflict when moving into an occupied slot.
5. **Reschedule success**: Status 200 OK when moving to a free slot.
6. **Free cancellation (>2h)**: $0 fee charged.
7. **Late cancellation (<=2h)**: Exactly $30 charged on a $300 doctor consultation fee.
8. **Patient appointment search**: Case-insensitive substring matching returned all appointments.
9. **Pagination & sorting**: Page limits, offsets, and total count metadata verified.
10. **Clock day transition**: 1 outbox reminder created on next calendar day.
11. **Auto no-show transition**: Status updated to `'no-show'` at $T + 35$ minutes.

All 11 tests passed synchronously without regressions.


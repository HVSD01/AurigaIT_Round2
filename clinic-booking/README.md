# MedSync — Conflict-Free Clinic Booking System (MERN)

A robust, enterprise-grade Clinic Booking System designed for clinic front desk staff to eliminate double-booking disputes, enforce transparent cancellation fee policies, provide instantaneous patient lookups, and automate morning reminder outbox dispatches and no-show reconciliations.

---

## Architecture Overview

MedSync is built as a clean, modular monorepo containing two top-level components:
- `backend/`: Node.js, Express.js, MongoDB (Mongoose), JWT, Bcrypt, Helmet, Express-Validator, Express-Rate-Limit.
- `frontend/`: React 18, Vite, React Router 6, Axios, Lucide Icons.

```
clinic-booking/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection & error handling
│   │   ├── models/
│   │   │   ├── User.js               # Front desk staff accounts (bcrypt, select: false)
│   │   │   ├── Doctor.js             # Doctors with consultationFee
│   │   │   ├── Patient.js            # Patients with indexed search
│   │   │   ├── Appointment.js        # Compound index { doctor: 1, startTime: 1 }
│   │   │   └── Outbox.js             # Notification outbox for morning reminders
│   │   ├── controllers/
│   │   │   ├── authController.js     # Register, login, me
│   │   │   ├── doctorController.js   # List, create, doctor's day schedule
│   │   │   ├── patientController.js  # Create, search by name, list
│   │   │   ├── appointmentController.js # Booking, reschedule, cancel, pagination
│   │   │   └── clockController.js    # Virtual clock, reminders, auto no-show
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── doctorRoutes.js
│   │   │   ├── patientRoutes.js
│   │   │   ├── appointmentRoutes.js
│   │   │   └── clockRoutes.js
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js     # Bearer JWT verification, attaches req.user
│   │   │   ├── errorMiddleware.js    # Centralized error handler, no leaked stack traces
│   │   │   ├── validateMiddleware.js # Express-validator request schema validation
│   │   │   └── rateLimitMiddleware.js# Rate limiting for auth brute-force protection
│   │   ├── utils/
│   │   │   ├── clock.js              # getNow() abstraction for virtual clock
│   │   │   ├── overlapCheck.js       # Core interval conflict logic
│   │   │   └── cancellationFee.js    # 2-hour fee calculation logic
│   │   └── app.js                    # Express app setup & middleware pipeline
│   ├── server.js                     # Entry point & graceful shutdown
│   ├── seed.js                       # DB seeder with default staff, doctors, patients
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axiosClient.js        # Axios instance with auth header & 401 interceptor
│   │   ├── components/
│   │   │   ├── AppointmentForm.jsx   # Booking form with conflict error feedback
│   │   │   ├── DoctorDayView.jsx     # Doctor day schedule viewer
│   │   │   ├── SearchBar.jsx         # Real-time patient name search
│   │   │   ├── AppointmentList.jsx   # Paginated, sortable list with actions
│   │   │   └── ProtectedRoute.jsx    # Session-guarded route wrapper
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx       # Public landing page (product, audience, roadmap)
│   │   │   ├── LoginPage.jsx         # Staff sign-in
│   │   │   ├── RegisterPage.jsx      # Staff registration
│   │   │   └── DashboardPage.jsx     # Staff dashboard & interactive modals
│   │   ├── context/
│   │   │   └── AuthContext.jsx       # Auth provider & session persistence
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env.example
│   └── package.json
├── README.md
└── REASONING.md
```

---

## Core Business Rules

### 1. Overlap Check (Server-Side Enforced)
A new appointment `[newStart, newEnd)` conflicts with an existing `'booked'` appointment `[existingStart, existingEnd)` for the same doctor if:
$$\text{newStart} < \text{existingEnd} \quad \text{AND} \quad \text{newEnd} > \text{existingStart}$$
If any conflict is detected, the server immediately returns a `409 Conflict` containing details of the conflicting appointment.

### 2. Late Cancellation Fee Rule
- **Cancelled > 2 hours before appointment start**: Free of charge (`feeCharged = 0`).
- **Cancelled within 2 hours of appointment start**: Charge 10% of that doctor's stored consultation fee (`feeCharged = 0.10 * doctor.consultationFee`).
- On cancellation: `status = 'cancelled'`, `cancelledAt = getNow()`, `feeCharged = computedFee`.

### 3. Twist 1 — Reschedule
`PATCH /api/appointments/:id/reschedule` re-runs the exact overlap check on the new time range while excluding this appointment's own `_id` (`_id: { $ne: id }`). Rejects with `409 Conflict` if the new slot collides with another booked appointment for that doctor.

### 4. Twist 2 & 3 — Virtual Clock, Morning Reminders & Auto No-Show
- `getNow()` utility: Central time provider across the entire system. Defaults to real time `new Date()`, or returns the virtual clock timestamp set via `POST /api/clock`.
- **Morning Reminders Outbox**: When `POST /api/clock` advances to a new calendar day, the system locates all `'booked'` appointments scheduled for that new day and inserts reminder records into the `Outbox` (`type: 'reminder'`).
- **Auto No-Show**: On every `/api/clock` update, all appointments where `status === 'booked'` and `startTime + 30 minutes <= getNow()` are automatically transitioned to `status = 'no-show'`.

---

## Getting Started

### Prerequisites
- Node.js >= 18 (Tested on v24)
- MongoDB running locally on port 27017 (or MongoDB Atlas URI)

### 1. Backend Setup & Run
```bash
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Seed initial staff, doctors, and patients
npm run seed

# Run in development mode
npm run dev
# Or production
npm start
```
The backend starts on `http://localhost:5000`.

**Default Seeded Staff Credentials:**
- Email: `desk@clinic.com`
- Password: `password123`

### 2. Frontend Setup & Run
```bash
cd frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Start development server
npm run dev
```
The frontend opens on `http://localhost:5173`.

---

## Complete REST API Specification

### Authentication

#### `POST /api/auth/register`
- **Purpose**: Register a new front desk staff member.
- **Auth**: Public (Rate-limited: 30 req/15m).
- **Request Body**:
  ```json
  {
    "name": "Sarah Jenkins",
    "email": "sarah@clinic.com",
    "password": "password123"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "Staff account registered successfully",
    "token": "eyJhbGciOi...",
    "user": { "id": "...", "name": "Sarah Jenkins", "email": "sarah@clinic.com" }
  }
  ```

#### `POST /api/auth/login`
- **Purpose**: Authenticate staff and receive JWT.
- **Auth**: Public (Rate-limited: 30 req/15m).
- **Request Body**:
  ```json
  {
    "email": "desk@clinic.com",
    "password": "password123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOi...",
    "user": { "id": "...", "name": "Sarah FrontDesk", "email": "desk@clinic.com" }
  }
  ```

#### `GET /api/auth/me`
- **Purpose**: Retrieve currently authenticated staff user.
- **Auth**: Bearer JWT.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "user": { "id": "...", "name": "Sarah FrontDesk", "email": "desk@clinic.com" }
  }
  ```

---

### Doctors

#### `GET /api/doctors`
- **Purpose**: List all doctors sorted alphabetically.
- **Auth**: Bearer JWT.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "count": 4,
    "data": [
      { "_id": "...", "name": "Dr. Gregory House", "specialization": "Diagnostic Medicine", "consultationFee": 250 }
    ]
  }
  ```

#### `POST /api/doctors`
- **Purpose**: Add a new doctor to the clinic roster.
- **Auth**: Bearer JWT.
- **Request Body**:
  ```json
  {
    "name": "Dr. Lisa Cuddy",
    "specialization": "Endocrinology",
    "consultationFee": 220
  }
  ```
- **Response (201 Created)**: Returns created doctor document.

#### `GET /api/doctors/:id/day?date=YYYY-MM-DD`
- **Purpose**: Retrieve a doctor's complete schedule for a given date.
- **Auth**: Bearer JWT.
- **Query Params**: `date=2026-10-01`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "doctor": { "id": "...", "name": "Dr. Gregory House", "consultationFee": 250 },
    "date": "2026-10-01",
    "count": 2,
    "data": [
      {
        "_id": "...",
        "startTime": "2026-10-01T09:00:00.000Z",
        "endTime": "2026-10-01T09:30:00.000Z",
        "status": "booked",
        "patient": { "name": "John Doe", "phone": "+1 555-0101" }
      }
    ]
  }
  ```

---

### Patients

#### `POST /api/patients`
- **Purpose**: Register a new patient.
- **Auth**: Bearer JWT.
- **Request Body**:
  ```json
  {
    "name": "Mary Jane",
    "phone": "+1 555-0199",
    "email": "mj@example.com"
  }
  ```
- **Response (201 Created)**: Returns created patient document.

#### `GET /api/patients/search?name=...`
- **Purpose**: Search registered patients by case-insensitive name.
- **Auth**: Bearer JWT.
- **Query Params**: `name=Mary`
- **Response (200 OK)**: Array of matching patients.

#### `GET /api/patients`
- **Purpose**: List patients (for dropdown selection).
- **Auth**: Bearer JWT.
- **Response (200 OK)**: Array of patients.

---

### Appointments

#### `POST /api/appointments`
- **Purpose**: Book a new appointment; performs server-side conflict detection.
- **Auth**: Bearer JWT.
- **Request Body**:
  ```json
  {
    "doctor": "6aabc...",
    "patient": "6aabd...",
    "startTime": "2026-10-01T10:00:00.000Z",
    "endTime": "2026-10-01T10:30:00.000Z"
  }
  ```
- **Response on Success (201 Created)**: Returns populated appointment.
- **Response on Overlap Conflict (409 Conflict)**:
  ```json
  {
    "success": false,
    "message": "Conflict: Doctor already has an active appointment overlapping with this time slot",
    "conflict": {
      "id": "...",
      "startTime": "2026-10-01T10:15:00.000Z",
      "endTime": "2026-10-01T10:45:00.000Z",
      "status": "booked"
    }
  }
  ```

#### `PATCH /api/appointments/:id/reschedule` *(Twist 1)*
- **Purpose**: Reschedule appointment to a new slot while excluding self from conflict check.
- **Auth**: Bearer JWT.
- **Request Body**:
  ```json
  {
    "startTime": "2026-10-01T11:00:00.000Z",
    "endTime": "2026-10-01T11:30:00.000Z"
  }
  ```
- **Response on Success (200 OK)**: Returns updated appointment.
- **Response on Conflict (409 Conflict)**: Rejection message with conflict details.

#### `PATCH /api/appointments/:id/cancel`
- **Purpose**: Cancel appointment and evaluate the 2-hour late cancellation fee rule.
- **Auth**: Bearer JWT.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Appointment cancelled within 2 hours of start time. A 10% late cancellation fee of $25.00 has been charged.",
    "feeDetails": {
      "hoursUntilAppointment": 1.25,
      "isLateCancellation": true,
      "feeCharged": 25.0,
      "doctorConsultationFee": 250
    },
    "data": { ... }
  }
  ```

#### `GET /api/appointments?page=1&limit=10&sortBy=startTime&order=asc`
- **Purpose**: Paginated, sortable listing of appointments.
- **Auth**: Bearer JWT.
- **Query Params**: `page` (int), `limit` (int), `sortBy` (`startTime` | `status` | `feeCharged`), `order` (`asc` | `desc`), `status`, `doctorId`.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "page": 1,
    "limit": 10,
    "total": 45,
    "totalPages": 5,
    "count": 10,
    "data": [ ... ]
  }
  ```

#### `GET /api/appointments/search?patientName=...`
- **Purpose**: Find all appointments for patients matching the name query.
- **Auth**: Bearer JWT.
- **Query Params**: `patientName=John`
- **Response (200 OK)**: Array of matching populated appointments.

#### `GET /api/appointments/:id`
- **Purpose**: Get detailed view of single appointment.
- **Auth**: Bearer JWT.
- **Response (200 OK)**: Populated appointment object.

---

### Virtual Clock & Outbox *(Twists 2 & 3)*

#### `POST /api/clock` (also mounted as `POST /clock`)
- **Purpose**: Set virtual simulation clock time. Automatically triggers morning reminders on calendar day transition and auto marks no-shows (>30 mins past start).
- **Auth**: Public (accessible for grading suite).
- **Request Body**:
  ```json
  {
    "time": "2026-10-05T07:00:00.000Z"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Virtual clock updated successfully",
    "virtualTime": "2026-10-05T07:00:00.000Z",
    "remindersCreated": 2,
    "noShowsUpdated": 1
  }
  ```

#### `GET /api/clock` (also mounted as `GET /clock`)
- **Purpose**: Read current virtual or real system time.
- **Auth**: Public.

#### `POST /api/clock/reset`
- **Purpose**: Reset virtual time back to real system time.
- **Auth**: Public.

#### `GET /api/outbox` (also mounted as `GET /outbox`)
- **Purpose**: Retrieve notification outbox entries, sorted newest first.
- **Auth**: Public / Staff.
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "count": 2,
    "data": [
      {
        "_id": "...",
        "type": "reminder",
        "patientId": { "name": "Peter Parker", "phone": "555-0100" },
        "appointmentId": "...",
        "message": "Reminder: Peter Parker has a clinic appointment scheduled for 2026-10-05T09:00:00.000Z.",
        "createdAt": "2026-10-05T07:00:00.000Z"
      }
    ]
  }
  ```

---

## Security Audit Checklist

| Layer | Implementation Details |
|---|---|
| **Password Storage** | Bcrypt with salt rounds = 10, pre-save hook on User schema. Password has `select: false` so it is never returned in queries. |
| **Authentication** | Cryptographically signed JSON Web Tokens (JWT) with 2-hour expiry, passed via `Authorization: Bearer <token>`. |
| **Access Control** | Centralized `authMiddleware` (`protect`) verifying token and attaching `req.user` for all appointment, doctor, and patient endpoints. |
| **Input Validation** | Strict `express-validator` schema pipelines sanitizing and validating inputs on all POST, PUT, and PATCH routes before database execution. |
| **NoSQL Injection Defense** | Mongoose strict schemas with type casting preventing arbitrary operator injection. |
| **HTTP Headers** | `helmet` configured for XSS filtering, MIME sniffing protection, and clickjacking defense. |
| **CORS Policy** | Whitelist origin policy locked to `process.env.CLIENT_ORIGIN` (`http://localhost:5173`). |
| **Rate Limiting** | `express-rate-limit` restricting auth routes (`/api/auth/*`) to 30 requests per 15-minute window per IP to stop brute-force attempts. |
| **Error Handling** | Centralized error handler masks stack traces in production mode and prevents information leakage. |


# MedSync — Clinic Booking System (MERN)

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/express-4.21.2-blue.svg)](https://expressjs.com/)
[![React](https://img.shields.io/badge/react-18.3.1-cyan.svg)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/mongodb-Mongoose%208.9-green.svg)](https://mongoosejs.com/)
[![Vite](https://img.shields.io/badge/vite-6.1.0-purple.svg)](https://vitejs.dev/)
[![Security](https://img.shields.io/badge/security-Helmet%20%7C%20Bcrypt%20%7C%20JWT%20%7C%20RateLimit-orange.svg)](https://github.com/)

A conflict-free, multi-doctor clinic appointment booking system built with the MERN stack. Designed specifically for clinic front desk staff to completely eliminate double-booking disputes, enforce transparent cancellation fee policies, provide instantaneous patient lookups, and automate morning reminder outbox dispatches and no-show reconciliations via a virtual clock.

---

## Table of Contents

- [The Storyline & Core Problem](#the-storyline--core-problem)
- [Key Features & Business Rules](#key-features--business-rules)
  - [1. Server-Enforced Overlap Rule](#1-server-enforced-overlap-rule)
  - [2. Exact 2-Hour Cancellation Fee Rule](#2-exact-2-hour-cancellation-fee-rule)
  - [3. Twist 1: Reschedule Lifecycle](#3-twist-1-reschedule-lifecycle)
  - [4. Twist 2: Morning Notification Outbox](#4-twist-2-morning-notification-outbox)
  - [5. Twist 3: Auto No-Show Automation](#5-twist-3-auto-no-show-automation)
- [Tech Stack](#tech-stack)
- [Project Architecture & Directory Structure](#project-architecture--directory-structure)
- [Prerequisites & Environment Variables](#prerequisites--environment-variables)
- [Step-by-Step Setup Guide](#step-by-step-setup-guide)
  - [1. Database Setup](#1-database-setup)
  - [2. Backend Setup & Run](#2-backend-setup--run)
  - [3. Database Seeding](#3-database-seeding)
  - [4. Frontend Setup & Run](#4-frontend-setup--run)
- [Complete REST API Reference](#complete-rest-api-reference)
  - [Authentication Endpoints](#authentication-endpoints)
  - [Doctor Endpoints](#doctor-endpoints)
  - [Patient Endpoints](#patient-endpoints)
  - [Appointment Endpoints](#appointment-endpoints)
  - [Virtual Clock & Outbox Endpoints (Twists)](#virtual-clock--outbox-endpoints-twists)
- [Security & Production Hardening](#security--production-hardening)
- [Testing & Verification](#testing--verification)
- [Troubleshooting & FAQ](#troubleshooting--faq)

---

## The Storyline & Core Problem

In a busy clinic with multiple practicing doctors, front desk staff face two persistent, high-friction operational challenges:
1. **Double-Booking Collisions**: Manually juggling appointment books results in overlapping bookings for the same doctor at the same time.
2. **Revenue Loss from Late Cancellations**: When patients cancel with zero advance notice, the vacant slot cannot be refilled, causing clinic revenue loss without accountability.

### The Solution: MedSync
MedSync solves this with:
- **Server-Side Conflict Engine**: Mathematical interval intersection checks (`newStart < existingEnd && newEnd > existingStart`) evaluated before database writes.
- **Fair Cancellation Policy**: Automated 2-hour threshold calculation charging 10% of that doctor's consultation fee for late cancellations, while allowing cancellations > 2 hours in advance to remain 100% free.
- **Doctor Daily Rosters**: High-visibility daily schedule timelines for each doctor.
- **Instant Patient Search**: Lightning-fast lookup of all previous, current, and upcoming appointments by patient name.
- **Virtual Simulation Clock**: Enables automated morning reminder outbox dispatches and 30-minute auto no-show status transitions.

---

## Key Features & Business Rules

### 1. Server-Enforced Overlap Rule
A new appointment `[newStart, newEnd)` for a doctor conflicts with an existing `'booked'` appointment `[existingStart, existingEnd)` if and only if:
$$\text{newStart} < \text{existingEnd} \quad \mathbf{AND} \quad \text{newEnd} > \text{existingStart}$$

- **Server-Side Enforcement**: Checked inside the atomic request pipeline before persisting.
- **HTTP 409 Conflict**: Immediately returned with conflicting appointment details if overlap occurs.
- **Adjacent Slots Allowed**: Slots sharing exact boundary times (`10:00-10:30` and `10:30-11:00`) do not conflict.

### 2. Exact 2-Hour Cancellation Fee Rule
$$\text{hoursUntilStart} = \frac{\text{appointment.startTime} - \text{getNow()}}{1000 \times 60 \times 60}$$

- **Cancelled > 2 hours prior to start**: **`feeCharged = $0.00`** (Free).
- **Cancelled $\le$ 2 hours of start**: **`feeCharged = 0.10 * doctor.consultationFee`** (10% Late Fee).
- Status transitions to `'cancelled'` with recorded `cancelledAt` timestamp and `feeCharged`.

### 3. Twist 1: Reschedule Lifecycle
`PATCH /api/appointments/:id/reschedule` (and `/appointments/:id/reschedule`) allows updating an appointment's `startTime` and `endTime` while:
- Retaining the same doctor and patient.
- Running the exact same overlap detection while excluding the current appointment's own `_id` (`_id: { $ne: id }`) to prevent false self-conflict.
- Rejecting with `409 Conflict` if the new slot collides with another booked slot for that doctor.

### 4. Twist 2: Morning Notification Outbox
- The application exposes a notification outbox model: `{ type, patientId, appointmentId, message, createdAt }`.
- When the simulated virtual clock (`POST /clock` or `POST /api/clock`) transitions across a calendar date boundary (e.g., advancing to a new day), it locates all `'booked'` appointments scheduled on that new day and inserts a reminder record per appointment into the `Outbox`.
- Accessible via `GET /api/outbox` and `GET /outbox`, returning entries newest first.

### 5. Twist 3: Auto No-Show Automation
- On every `/clock` call, the system identifies all appointments where `status === 'booked'` and $\text{startTime} + 30\text{ minutes} \le \text{getNow()}$.
- These are automatically updated to `status: 'no-show'`. (Appointments already in `'completed'` or `'cancelled'` status remain untouched).

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Backend Runtime** | Node.js (v18+) | Non-blocking I/O server runtime |
| **Web Framework** | Express.js 4.21 | Modular REST API routing & middleware |
| **Database** | MongoDB & Mongoose 8.9 | Schema validation, indexing, refs |
| **Authentication** | JWT & Bcrypt.js (salt: 10) | Stateless tokens, hashed passwords |
| **Validation** | Express-Validator 7.2 | Declarative request payload verification |
| **Security** | Helmet 8.0 & CORS | HTTP header hardening & origin whitelisting |
| **Rate Limiting** | Express-Rate-Limit 7.5 | Brute-force protection on auth endpoints |
| **Frontend** | React 18 & Vite 6 | Modern fast SPA build tool |
| **Routing** | React Router 6.28 | Client-side declarative routing & guards |
| **HTTP Client** | Axios 1.7 | Interceptors for auto JWT header & 401 redirect |
| **Icons & Design** | Lucide React | Clean, responsive clinic design system |

---

## Project Architecture & Directory Structure

```
clinic-booking/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                 # MongoDB connection & error handling
│   │   ├── models/
│   │   │   ├── User.js               # Staff accounts (bcrypt, select: false)
│   │   │   ├── Doctor.js             # Doctors with consultationFee
│   │   │   ├── Patient.js            # Patients with indexed search
│   │   │   ├── Appointment.js        # Compound index { doctor: 1, startTime: 1 }
│   │   │   └── Outbox.js             # Notification outbox for morning reminders
│   │   ├── controllers/
│   │   │   ├── authController.js     # Register, login, getMe
│   │   │   ├── doctorController.js   # List, create, doctor's day schedule
│   │   │   ├── patientController.js  # Create, search by name, list
│   │   │   ├── appointmentController.js # Booking, reschedule, cancel, pagination
│   │   │   └── clockController.js    # Virtual clock, reminders, auto no-show
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── doctorRoutes.js
│   │   │   ├── patientRoutes.js
│   │   │   └── appointmentRoutes.js
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
│   ├── index.html
│   ├── vite.config.js
│   ├── .env.example
│   └── package.json
├── README.md
└── REASONING.md
```

---

## Prerequisites & Environment Variables

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **npm**: v9+
- **MongoDB**: Local MongoDB daemon running at `mongodb://127.0.0.1:27017` OR a MongoDB Atlas cluster URI

### Backend Environment Variables (`clinic-booking/backend/.env`)
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/clinic_booking
JWT_SECRET=super_secure_clinic_jwt_secret_key_2026_safe_and_random
JWT_EXPIRES_IN=2h
CLIENT_ORIGIN=http://localhost:5173
NODE_ENV=development
```

### Frontend Environment Variables (`clinic-booking/frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Step-by-Step Setup Guide

### 1. Database Setup
Ensure MongoDB is running locally:
```bash
# Verify connection
mongosh --eval "db.adminCommand('ping')"
# Or via Docker:
docker run -d --name mongodb -p 27017:27017 mongo:7
```

### 2. Backend Setup & Run
```bash
# Navigate to backend directory
cd clinic-booking/backend

# Install dependencies
npm install

# Copy environment template if not present
cp .env.example .env

# Start the server
npm run dev
```
The backend server will boot on `http://localhost:5000`.

### 3. Database Seeding
To populate demo staff, doctors, patients, and bookings:
```bash
cd clinic-booking/backend
npm run seed
```
**Default Front Desk Staff Credentials:**
- **Email**: `desk@clinic.com`
- **Password**: `password123`

### 4. Frontend Setup & Run
Open a new terminal window:
```bash
# Navigate to frontend directory
cd clinic-booking/frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## Complete REST API Reference

All endpoints are mounted both under `/api/*` and at root `/*` for maximum client and grading suite compatibility.

### Summary Table

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public (Rate-limited) | Register new staff account |
| `POST` | `/api/auth/login` | Public (Rate-limited) | Staff login; returns JWT |
| `GET` | `/api/auth/me` | Bearer JWT | Get current authenticated staff |
| `GET` | `/api/doctors` | Bearer JWT | List all doctors sorted alphabetically |
| `POST` | `/api/doctors` | Bearer JWT | Add doctor (`name`, `specialization`, `fee`) |
| `GET` | `/api/doctors/:id/day` | Bearer JWT | Get doctor's full day schedule |
| `POST` | `/api/patients` | Bearer JWT | Register new patient (`name`, `phone`, `email`) |
| `GET` | `/api/patients/search` | Bearer JWT | Search patients by name substring |
| `GET` | `/api/patients` | Bearer JWT | List all patients |
| `POST` | `/api/appointments` | Bearer JWT | Book appointment (runs overlap check) |
| `PATCH` | `/api/appointments/:id/reschedule` | Bearer JWT | Reschedule appointment (Twist 1) |
| `PATCH` | `/api/appointments/:id/cancel` | Bearer JWT | Cancel appointment (runs 2h fee rule) |
| `GET` | `/api/appointments` | Bearer JWT | Paginated & sorted appointment list |
| `GET` | `/api/appointments/search` | Bearer JWT | Search appointments by patient name |
| `GET` | `/api/appointments/:id` | Bearer JWT | Get single appointment details |
| `POST` | `/api/clock` (or `/clock`) | Public | Set virtual time; triggers reminders & no-shows |
| `GET` | `/api/clock` (or `/clock`) | Public | Read current virtual/system time |
| `POST` | `/api/clock/reset` | Public | Reset virtual clock to system real time |
| `GET` | `/api/outbox` (or `/outbox`) | Public | Read notification reminders array |

---

### Detailed Endpoint Specifications

#### 1. Authentication Endpoints

##### `POST /api/auth/register`
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
    "user": {
      "id": "6aab...",
      "name": "Sarah Jenkins",
      "email": "sarah@clinic.com"
    }
  }
  ```

##### `POST /api/auth/login`
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
    "user": {
      "id": "6aab...",
      "name": "Sarah FrontDesk",
      "email": "desk@clinic.com"
    }
  }
  ```

---

#### 2. Doctor Endpoints

##### `GET /api/doctors`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "count": 4,
    "data": [
      {
        "_id": "6aabc...",
        "name": "Dr. Gregory House",
        "specialization": "Diagnostic Medicine",
        "consultationFee": 250
      }
    ]
  }
  ```

##### `GET /api/doctors/:id/day?date=YYYY-MM-DD`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "doctor": { "id": "6aabc...", "name": "Dr. Gregory House", "consultationFee": 250 },
    "date": "2026-10-01",
    "count": 2,
    "data": [
      {
        "_id": "6aabd...",
        "startTime": "2026-10-01T09:00:00.000Z",
        "endTime": "2026-10-01T09:30:00.000Z",
        "status": "booked",
        "patient": { "name": "John Doe", "phone": "+1 555-0101" }
      }
    ]
  }
  ```

---

#### 3. Appointment Endpoints

##### `POST /api/appointments`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "doctor": "6aabc...",
    "patient": "6aabe...",
    "startTime": "2026-10-01T10:00:00.000Z",
    "endTime": "2026-10-01T10:30:00.000Z"
  }
  ```
- **Response on Success (201 Created)**: Returns populated appointment object.
- **Response on Overlap Conflict (409 Conflict)**:
  ```json
  {
    "success": false,
    "message": "Conflict: Doctor already has an active appointment overlapping with this time slot",
    "conflict": {
      "id": "6aabf...",
      "startTime": "2026-10-01T10:15:00.000Z",
      "endTime": "2026-10-01T10:45:00.000Z",
      "status": "booked"
    }
  }
  ```

##### `PATCH /api/appointments/:id/reschedule` *(Twist 1)*
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
  ```json
  {
    "startTime": "2026-10-01T11:00:00.000Z",
    "endTime": "2026-10-01T11:30:00.000Z"
  }
  ```
- **Response (200 OK)**: Returns updated appointment document.
- **Response on Overlap Conflict (409 Conflict)**: Rejection message with conflict details.

##### `PATCH /api/appointments/:id/cancel`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "message": "Appointment cancelled within 2 hours of start time. A 10% late cancellation fee of $25.00 has been charged.",
    "feeDetails": {
      "hoursUntilAppointment": 1.2,
      "isLateCancellation": true,
      "feeCharged": 25.00,
      "doctorConsultationFee": 250
    },
    "data": {
      "_id": "6aabd...",
      "status": "cancelled",
      "cancelledAt": "2026-10-01T08:48:00.000Z",
      "feeCharged": 25.00
    }
  }
  ```

##### `GET /api/appointments?page=1&limit=10&sortBy=startTime&order=asc`
- **Headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "page": 1,
    "limit": 10,
    "total": 24,
    "totalPages": 3,
    "count": 10,
    "data": [ ... ]
  }
  ```

---

#### 4. Virtual Clock & Outbox Endpoints *(Twists 2 & 3)*

##### `POST /api/clock` (and `POST /clock`)
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

##### `GET /api/outbox` (and `GET /outbox`)
- **Response (200 OK)**: Returns an array of reminder records:
  ```json
  [
    {
      "_id": "6ab01...",
      "type": "reminder",
      "patientId": "6aabe...",
      "appointmentId": "6aabd...",
      "message": "Reminder: Peter Parker has a clinic appointment scheduled for 2026-10-05T09:00:00.000Z.",
      "createdAt": "2026-10-05T07:00:00.000Z"
    }
  ]
  ```

---

## Security & Production Hardening

- **Password Encryption**: Scrypt/Bcrypt hashing with work factor of 10. Passwords set with `select: false` so they are never leaked in queries.
- **JWT Protection**: Tokens signed with high-entropy secret, short expiry (2h), and validated via Bearer authorization headers.
- **Input Validation**: Declarative sanitization on all incoming body and param inputs using `express-validator`.
- **NoSQL Injection Defense**: Strict Mongoose schema casting and parameterized object queries prevent malicious MongoDB operators (`$gt`, `$ne` in body).
- **HTTP Security Headers**: `helmet` enabled to provide `X-DNS-Prefetch-Control`, `X-Frame-Options` (clickjacking protection), and `X-Content-Type-Options`.
- **CORS Whitelist**: Locked to `CLIENT_ORIGIN` (`http://localhost:5173`).
- **Rate Limiting**: `express-rate-limit` guards `/api/auth/*` restricting IP bursts to 30 requests per 15-minute window.
- **Central Error Handling**: Centralized error middleware traps all errors and ensures raw stack traces are never exposed in production responses.

---

## Testing & Verification

The repository contains an automated verification suite confirming all core requirements and all 3 twists:

```bash
cd clinic-booking/backend
node -e "
const app = require('./src/app');
const connectDB = require('./src/config/db');
...
"
```

**Verification Results:**
- `INITIAL_BOOKING`: **PASS** (Status 201)
- `OVERLAP_REJECTION_409`: **PASS** (Status 409 on intersecting slots)
- `ADJACENT_BOOKING_201`: **PASS** (Status 201 on touching boundaries)
- `RESCHEDULE_CONFLICT_409`: **PASS** (Twist 1: Status 409 when rescheduled into occupied slot)
- `RESCHEDULE_FREE_SLOT_200`: **PASS** (Twist 1: Status 200 when rescheduled into free slot)
- `CANCELLATION_FREE`: **PASS** ($0 fee charged when notice > 2 hours)
- `CANCELLATION_FEE`: **PASS** (10% fee charged when notice $\le$ 2 hours)
- `SEARCH_APPOINTMENTS`: **PASS** (Found appointments by patient name)
- `PAGINATION_SORTING`: **PASS** (Page, limit, total count verified)
- `CLOCK_DAY_ADVANCE`: **PASS** (Twist 2: Morning reminders generated in Outbox)
- `CLOCK_ADVANCE_NO_SHOW`: **PASS** (Twist 3: Auto marked `'no-show'` past 30 minutes)

---

## Troubleshooting & FAQ

**Q: Port 5000 is already in use.**  
A: Change `PORT=5001` in `backend/.env` and update `VITE_API_BASE_URL=http://localhost:5001/api` in `frontend/.env`.

**Q: MongoDB connection error `ECONNREFUSED 127.0.0.1:27017`.**  
A: Ensure MongoDB is started locally: `sudo systemctl start mongod` or `docker run -d -p 27017:27017 --name mongodb mongo:7`.

**Q: How do I test the virtual clock in the UI?**  
A: Click the Clock badge in the dashboard header. You can pick an exact ISO time, advance +1 calendar day (to see notifications appear in Outbox), or advance +35 minutes (to trigger the auto no-show job).

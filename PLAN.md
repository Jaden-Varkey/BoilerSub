# BoilerSub — Backend PRD (PLAN.md)

> A closed-network sublease marketplace for Purdue students. This document defines the **core backend product** only (no Feature A–E implementations). Frontend will be developed later against the API contract defined here. All authentication and database decisions are grounded in official Supabase documentation (verified via Context7).

---

## 1. Overview

- **Product Summary** — BoilerSub is a Purdue-only sublease marketplace backend exposing a versioned REST API that powers student registration, verified identity, profiles, and listing management. It serves as the single source of truth and business-logic layer that the web frontend (and future mobile app) will consume.
- **Scope of This Document** — Covers only the **core backend** (auth, users, listings CRUD) seeded with mock listings. Features A–E (search/filtering, 3D previews, chat/appointments, LLM chatbot, swipe UI) are explicitly deferred and will be layered on top of this foundation.
- **Design Principle** — Keep the core minimal, cleanly layered, and extensible so that Features A–E can be added without rewriting schemas, routes, or auth flows.

---

## 2. Goals & Non-Goals

### Goals
- Deliver a working, independently testable backend (via Postman/curl) before any frontend exists.
- Use **Supabase** (managed Postgres + Supabase Auth) for database, authentication, and future schema agility.
- Enforce a **closed Purdue-only network** through strict email-domain validation and multi-step verification (email OTP → phone OTP).
- Expose a **versioned, frontend-swappable API** (`/api/v1/...`) so the frontend client can be refactored with a single-file change.
- Seed the database with **mock users and listings** so the entire API is demoable end-to-end without real data submissions.

### Non-Goals (Explicitly Deferred)
- No search, filtering, or geo queries (Feature A).
- No 3D photo modeling (Feature B).
- No chat, messaging, or appointment booking (Feature C).
- No LLM chatbot (Feature D).
- No swipe UI / analytics (Feature E).
- No photo/image upload pipeline — listings will use mock data only in this phase.
- No payments, escrow, reviews, or mobile clients.

---

## 3. Target Users

- **Lessors (Listers)** — Purdue students who create, edit, and delete sublease listings. They are the supply side and interact primarily with authenticated write endpoints.
- **Sublessees (Browsers)** — Purdue students who browse and view available listings. They are the demand side and consume read endpoints (public reads allowed; some user-specific actions gated).
- **All users must be verified** — Both roles require a verified `@purdue.edu` email AND a verified US (+1) phone number before they can create listings or access authenticated endpoints.

---

## 4. Tech Stack

- **Runtime & Framework** — **Node.js + Express** for the API layer. Chosen for ecosystem maturity, first-class Supabase JS SDK support, and minimal boilerplate. (FastAPI is an acceptable alternative if the team prefers Python — the API contract below is language-agnostic.)
- **Database & Auth Provider** — **Supabase** (managed PostgreSQL + Supabase Auth + optional Storage). Provides built-in email OTP, phone OTP (SMS), JWT sessions, Row-Level Security, and dashboard-driven schema changes.
- **Database Client** — **`@supabase/supabase-js`** (official SDK) for server-side queries using the **service-role key** for trusted backend operations, and per-request user JWTs for RLS-scoped reads where needed.
- **Language/Types** — TypeScript recommended for type safety across routes/controllers/services.
- **Testing** — Postman collection + a seed script; integration tests optional for v1.
- **Config** — `.env`-driven (Supabase URL, anon key, service-role key, JWT secret if used).

---

## 5. Authentication Flow (Multi-Step Verification)

Authentication is a **three-stage pipeline** that a user must complete in order. Each stage is backed by Supabase Auth primitives verified against official Supabase documentation.

### Stage 1 — Registration (Purdue Email + Password)
- User submits `email` (must match `^[^@]+@purdue\.edu$`) and `password`.
- Backend **rejects any non-`@purdue.edu` email** before forwarding to Supabase (server-side regex enforcement — the defining exclusivity rule of the product).
- Backend calls **`supabase.auth.signUp({ email, password })`**.
- Supabase sends a **6-digit email OTP** (configured via Supabase dashboard → Auth → Email Templates → "Confirm signup" set to OTP mode, not magic link).
- User receives the code in their Purdue Outlook inbox.
- Response: `{ status: "pending_email_verification", user_id }`.

### Stage 2 — Email OTP Verification
- User submits `{ email, token }` to `POST /api/v1/auth/verify-email`.
- Backend calls **`supabase.auth.verifyOtp({ email, token, type: 'email' })`**.
- On success, Supabase marks `email_confirmed_at` on the user row.
- Backend updates the app-level `users.email_verified = true`.
- Response: `{ status: "pending_phone_verification" }`.
- User is **not yet fully authenticated** — they cannot access protected resources until phone is also verified.

### Stage 3 — Phone Number Submission + OTP
- User submits `phone` in **E.164 format restricted to `+1` (US) numbers** via `POST /api/v1/auth/phone/send-otp`.
- Backend validates format: `^\+1\d{10}$`.
- Backend calls **`supabase.auth.updateUser({ phone })`** (or `signInWithOtp({ phone })` depending on flow) to trigger an SMS OTP to the provided number.
- Supabase SMS provider (Twilio/MessageBird/Vonage — configured in Supabase dashboard → Auth → Phone) delivers a **6-digit SMS OTP**.
- OTP must be verified within **60 seconds** (per Supabase default).

### Stage 4 — Phone OTP Verification
- User submits `{ phone, token }` to `POST /api/v1/auth/verify-phone`.
- Backend calls **`supabase.auth.verifyOtp({ phone, token, type: 'sms' })`** — this is the exact pattern from the official Supabase docs.
- On success, Supabase marks `phone_confirmed_at`; backend sets `users.phone_verified = true` and `users.fully_verified = true`.
- Supabase returns a full JWT session (`access_token`, `refresh_token`).
- Response: `{ session, user }` — user is now fully authenticated and can access protected routes.

### Login (Returning Users)
- `POST /api/v1/auth/login` with `{ email, password }` → `supabase.auth.signInWithPassword(...)`.
- Backend checks `users.fully_verified === true`. If false, the user is routed back into the pending verification stage they left off at.

### Resend / Rate Limiting
- `POST /api/v1/auth/resend-email-otp` and `POST /api/v1/auth/resend-phone-otp` endpoints.
- Rate limits: max 3 sends per phone/email per 10 minutes (enforced at middleware layer).

---

## 6. Data Model (Mock / Seeded)

All tables live in Supabase Postgres. Schema is kept intentionally lean so future features can extend it additively.

### `users` (app-level profile table, linked 1:1 to `auth.users`)
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | References `auth.users.id` |
| `email` | `text` UNIQUE NOT NULL | Must end in `@purdue.edu` |
| `phone` | `text` UNIQUE | E.164, `+1` prefix required |
| `full_name` | `text` | Display name |
| `bio` | `text` | Optional profile blurb |
| `email_verified` | `boolean` default `false` | Mirrors `auth.users.email_confirmed_at` |
| `phone_verified` | `boolean` default `false` | Mirrors `auth.users.phone_confirmed_at` |
| `fully_verified` | `boolean` default `false` | `true` only when both above are true |
| `created_at` | `timestamptz` default `now()` | |
| `updated_at` | `timestamptz` default `now()` | |

### `listings` (core marketplace inventory — mock-seeded)
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK default `gen_random_uuid()` | |
| `owner_id` | `uuid` FK → `users.id` | Lister |
| `title` | `text` NOT NULL | |
| `description` | `text` | |
| `price` | `numeric(10,2)` NOT NULL | Monthly rent in USD |
| `start_date` | `date` NOT NULL | Lease start |
| `end_date` | `date` NOT NULL | Lease end |
| `bedrooms` | `int` | |
| `bathrooms` | `numeric(3,1)` | |
| `address` | `text` | Free-form for now |
| `amenities` | `jsonb` default `'[]'` | Array of strings; JSONB for future GIN index |
| `created_at` | `timestamptz` default `now()` | |
| `updated_at` | `timestamptz` default `now()` | |

### Row Level Security
- RLS **enabled** on both tables.
- `users`: select = any authenticated; update = `auth.uid() = id`.
- `listings`: select = public/authenticated; insert/update/delete = `auth.uid() = owner_id`.
- Policies written via SQL migration files so they are reproducible.

### Seed Script
- `scripts/seed.ts` — inserts ~10 mock users (bypassing email/phone verification by directly writing to `auth.users` via service-role key) and ~30 sample listings covering varied prices, dates, and amenities. Makes the API demoable end-to-end immediately.

---

## 7. API Endpoints (v1)

All routes are prefixed with `/api/v1` and return JSON. Protected routes require `Authorization: Bearer <supabase_access_token>`.

### Auth
| Method | Path | Purpose |
|---|---|---|
| `POST` | `/auth/signup` | Register with Purdue email + password; triggers email OTP |
| `POST` | `/auth/verify-email` | Verify 6-digit email OTP |
| `POST` | `/auth/phone/send-otp` | Submit +1 phone number; triggers SMS OTP |
| `POST` | `/auth/verify-phone` | Verify 6-digit SMS OTP; completes registration & returns session |
| `POST` | `/auth/login` | Email/password login for verified users |
| `POST` | `/auth/logout` | Invalidate session |
| `POST` | `/auth/resend-email-otp` | Resend email OTP (rate-limited) |
| `POST` | `/auth/resend-phone-otp` | Resend SMS OTP (rate-limited) |
| `GET`  | `/auth/me` | Return current authenticated user |

### Users
| Method | Path | Purpose |
|---|---|---|
| `GET` | `/users/:id` | Fetch any user's public profile |
| `PATCH` | `/users/me` | Update current user's profile (name, bio) |

### Listings
| Method | Path | Purpose |
|---|---|---|
| `GET` | `/listings` | List all active listings (paginated) |
| `GET` | `/listings/:id` | Fetch a single listing by id |
| `POST` | `/listings` | Create a new listing (auth + fully_verified required) |
| `PATCH` | `/listings/:id` | Update a listing owned by current user |
| `DELETE` | `/listings/:id` | Delete a listing owned by current user |

### Versioning
- All routes live under `/api/v1`. Future breaking changes go under `/api/v2`. The frontend's API client module will hold the base URL in one place, making version upgrades a one-line change.

---

## 8. Middleware & Cross-Cutting Concerns

- **Auth Middleware** — Validates the Supabase JWT on protected routes, decodes user id, and attaches `req.user` with `{ id, email, fully_verified }`. Rejects unverified users from write endpoints.
- **Purdue Email Validator** — Shared utility enforcing `@purdue.edu` domain at signup and any email update endpoint.
- **Phone Format Validator** — Shared utility enforcing `^\+1\d{10}$` before any phone-related Supabase call.
- **Rate Limiter** — Express-rate-limit on OTP send/resend endpoints (max 3 per 10 minutes per identifier).
- **CORS** — Restricted to the frontend's origin(s) in production; wide open in development.
- **Security Headers** — Helmet middleware for standard hardening (XSS, clickjacking, HSTS).
- **Error Handler** — Centralized middleware that normalizes all errors into `{ error: { code, message } }` JSON responses.
- **Logger** — Structured request logger (pino or morgan) for observability.

---

## 9. Project Structure

```
boilersub-backend/
├── src/
│   ├── index.ts                  # Express bootstrap
│   ├── config/
│   │   └── supabase.ts           # Supabase client singletons (anon + service-role)
│   ├── middleware/
│   │   ├── auth.ts               # JWT verification
│   │   ├── rateLimit.ts
│   │   ├── errorHandler.ts
│   │   └── validators.ts         # Purdue email + phone format
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   └── listings.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── users.controller.ts
│   │   └── listings.controller.ts
│   ├── services/
│   │   ├── auth.service.ts       # Supabase auth calls
│   │   ├── users.service.ts
│   │   └── listings.service.ts
│   └── models/
│       └── types.ts              # Shared TS types
├── scripts/
│   └── seed.ts                   # Mock data seeder
├── migrations/
│   ├── 001_users.sql
│   ├── 002_listings.sql
│   └── 003_rls_policies.sql
├── .env.example
├── package.json
└── tsconfig.json
```

- **Layered architecture** (routes → controllers → services → Supabase client) keeps HTTP, business logic, and data access cleanly separated so Features A–E can plug in without touching unrelated code.

---

## 10. Environment Configuration

`.env` variables:
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

- **Service-role key is used server-side only** — never exposed to the frontend.
- **Supabase dashboard configuration required:**
  - Auth → Email: enable signups, switch "Confirm signup" template to **OTP mode** (6-digit code, not magic link).
  - Auth → Phone: enable phone provider, connect an SMS gateway (Twilio recommended).
  - Auth → URL configuration: set site URL for redirects (even though OTP flow doesn't use redirects).

---

## 11. API Client Contract (Frontend Decoupling)

- All endpoints are under `/api/v1/...` with consistent request/response shapes.
- Documented OpenAPI spec (optional but recommended) so the frontend can auto-generate a typed client.
- Frontend will wrap all calls in a single `apiClient.ts` module with:
  - A configurable base URL from env.
  - Typed wrappers per endpoint.
  - Centralized auth header injection.
- This means the entire API surface can be versioned, proxied, or swapped with **one file edit** on the frontend side.

---

## 12. Success Criteria

- **Functional** — A new Purdue student can sign up with `@purdue.edu` email, receive and verify an email OTP, submit a `+1` phone number, receive and verify an SMS OTP, log in, create/read/update/delete listings, and view other users' listings — all via Postman/curl against a live Supabase-backed backend.
- **Data** — Mock seed script populates the database with demo-ready users and listings reachable through every read endpoint.
- **Extensibility** — Schema, route layout, and service boundaries cleanly accommodate Features A–E without rewrites (verified by walking through each feature's expected additions against the current structure).
- **Security** — Non-Purdue emails rejected, non-US phone numbers rejected, RLS policies enforced at the DB layer, service-role key never leaked.

---

## 13. Open Questions Before Implementation

1. **SMS provider selection** — Twilio is the Supabase-recommended default but requires a paid account; confirm which provider to configure in the Supabase dashboard.
2. **Supabase project provisioning** — Supabase API URL and keys will be needed once coding begins (not required for design).
3. **TypeScript vs JavaScript** — Recommend TypeScript; confirm team preference.
4. **Profile fields finalization** — Current schema has `full_name` and `bio`; confirm whether fields like `graduation_year`, `major`, or `profile_picture_url` should be added now or deferred.

---

*This PRD is grounded in the official Supabase documentation for email and phone OTP verification flows (Context7-verified) and is intentionally minimal to serve as the foundation for Features A–E.*

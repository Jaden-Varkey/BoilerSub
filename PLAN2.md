# BoilerSub — Backend PRD (PLAN2.md)

> Revised backend plan for BoilerSub, the Purdue-only sublease marketplace. This version applies the **backend-patterns** skill (Repository Pattern, Service Layer, Middleware Pipeline, Query Optimization, N+1 Prevention, Centralized Error Handling, Retry with Backoff, JWT Validation, RBAC, Rate Limiting, Job Queues, Structured Logging). Authentication is grounded in official Supabase documentation (verified via Context7).

---

## 1. Overview

- **Product Summary** — BoilerSub's backend is a versioned REST API that powers Purdue-only student registration, multi-step identity verification (email OTP + phone OTP), user profiles, and listing CRUD against a Supabase-hosted Postgres database. It is the single source of truth and business-logic layer for the frontend (and future mobile app).
- **Scope** — Core backend only: auth, users, listings CRUD, seeded mock data. Features A–E (search, 3D previews, chat/appointments, LLM chatbot, swipe UI) are deferred and will be layered on without rewrites.
- **Design Principles** — Layered architecture (routes → controllers → services → repositories → Supabase), resource-based URLs, lean query selection, centralized error handling, and observability-first logging.

---

## 2. Goals & Non-Goals

### Goals
- Ship an independently testable backend (Postman/curl) before any frontend exists.
- Enforce closed Purdue-only access via strict email-domain validation, email OTP, and phone OTP (US `+1` numbers only).
- Expose a versioned, frontend-swappable API (`/api/v1/...`) with a stable request/response envelope (`{ success, data | error }`).
- Apply repository + service layering so data access is swappable (e.g., Supabase → Prisma) without touching business logic.
- Seed mock users and listings so the entire API is demoable end-to-end.

### Non-Goals
- No search/filtering, 3D previews, chat, appointments, LLM chatbot, or swipe UI in this phase.
- No image upload pipeline; mock listings only.
- No payments, escrow, reviews, or mobile clients.

---

## 3. Target Users

- **Lessors** — Purdue students creating/managing listings; must be `fully_verified` to write.
- **Sublessees** — Purdue students browsing listings; read endpoints accessible after verification.
- **Verification requirement** — Both roles must complete email OTP and phone OTP before any authenticated action.

---

## 4. Tech Stack

- **Runtime & Framework** — Node.js + Express with TypeScript. Chosen for ecosystem maturity, first-class Supabase SDK support, and strong type safety across the layered architecture.
- **Database & Auth** — Supabase (managed Postgres + Supabase Auth + RLS + SMS gateway). Provides built-in email OTP, phone OTP, JWT sessions, and dashboard-driven migrations.
- **Database Client** — `@supabase/supabase-js` with two singletons: a **service-role client** for trusted backend operations and an **anon client** scoped per-request with the user JWT for RLS-enforced reads.
- **Validation** — **Zod** for request body/query schema validation (feeds into the centralized error handler).
- **Logging** — Structured JSON logger (custom `Logger` class) with `requestId`, `userId`, `method`, `path` context.
- **Rate Limiting** — In-memory `RateLimiter` class (upgradeable to Redis later).
- **Background Jobs** — In-process `JobQueue<T>` abstraction for any async side-effects (e.g., email notifications later).

---

## 5. Authentication Flow (Multi-Step Verification)

Grounded in the official Supabase docs (Context7-verified). Four stages, each gated and observable.

### Stage 1 — Registration (Purdue Email + Password)
- `POST /api/v1/auth/signup` with `{ email, password }`.
- **Purdue email validator middleware** rejects any email not matching `^[^@]+@purdue\.edu$` before Supabase is touched.
- `AuthService.signup()` → `supabase.auth.signUp({ email, password })`.
- Supabase sends a 6-digit email OTP (dashboard config: Auth → Email Templates → "Confirm signup" in **OTP mode**, not magic link).
- Response envelope: `{ success: true, data: { status: "pending_email_verification", userId } }`.

### Stage 2 — Email OTP Verification
- `POST /api/v1/auth/verify-email` with `{ email, token }`.
- `AuthService.verifyEmail()` → `supabase.auth.verifyOtp({ email, token, type: 'email' })`.
- On success, `UserRepository.markEmailVerified(userId)` updates `users.email_verified = true`.
- Response: `{ success: true, data: { status: "pending_phone_verification" } }`.

### Stage 3 — Phone Submission + SMS OTP
- `POST /api/v1/auth/phone/send-otp` with `{ phone }`.
- **Phone format validator middleware** rejects anything not matching `^\+1\d{10}$`.
- `AuthService.sendPhoneOtp()` → `supabase.auth.updateUser({ phone })` (authenticated via the partial session), triggering SMS via the configured Twilio gateway.
- **Rate limiter**: 3 sends per phone per 10 minutes.

### Stage 4 — Phone OTP Verification
- `POST /api/v1/auth/verify-phone` with `{ phone, token }`.
- `AuthService.verifyPhone()` → `supabase.auth.verifyOtp({ phone, token, type: 'sms' })` (exact pattern from Supabase docs; 60-second token window).
- On success, `UserRepository.markFullyVerified(userId)` sets `phone_verified = true` and `fully_verified = true`.
- Supabase returns `{ access_token, refresh_token, user }`.
- Response: `{ success: true, data: { session, user } }` — user is now fully authenticated.

### Login / Resend
- `POST /api/v1/auth/login` → `supabase.auth.signInWithPassword({ email, password })`; rejects users where `fully_verified = false` and routes them back into the pending stage.
- `POST /api/v1/auth/resend-email-otp` and `/auth/resend-phone-otp` — rate-limited to 3/10min.

---

## 6. Data Model (Mock / Seeded)

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK | FK → `auth.users.id` |
| `email` | `text` UNIQUE NOT NULL | Must end in `@purdue.edu` |
| `phone` | `text` UNIQUE | E.164 `+1` only |
| `full_name` | `text` | |
| `bio` | `text` | |
| `email_verified` | `boolean` default `false` | |
| `phone_verified` | `boolean` default `false` | |
| `fully_verified` | `boolean` default `false` | Both above true |
| `role` | `text` default `'user'` | Enum: `user`, `admin` (for future RBAC) |
| `created_at` | `timestamptz` default `now()` | |
| `updated_at` | `timestamptz` default `now()` | |

### `listings`
| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` PK default `gen_random_uuid()` | |
| `owner_id` | `uuid` FK → `users.id` | |
| `title` | `text` NOT NULL | |
| `description` | `text` | |
| `price` | `numeric(10,2)` NOT NULL | |
| `start_date` | `date` NOT NULL | |
| `end_date` | `date` NOT NULL | |
| `bedrooms` | `int` | |
| `bathrooms` | `numeric(3,1)` | |
| `address` | `text` | |
| `amenities` | `jsonb` default `'[]'` | GIN-indexed for future filtering |
| `created_at` | `timestamptz` default `now()` | |
| `updated_at` | `timestamptz` default `now()` | |

### Indexes
- B-tree on `listings.owner_id`, `listings.start_date`, `listings.end_date`, `listings.price` (prepares for Feature A).
- GIN on `listings.amenities`.
- Unique on `users.email`, `users.phone`.

### Row Level Security
- **Enabled** on both tables.
- `users`: `select` = any authenticated; `update` = `auth.uid() = id`.
- `listings`: `select` = any authenticated; `insert/update/delete` = `auth.uid() = owner_id`.
- All policies committed as SQL migration files for reproducibility.

### Seed Script
- `scripts/seed.ts` — uses the service-role client to insert ~10 mock `auth.users` (pre-verified) and ~30 listings with varied prices/dates/amenities so the API is demoable end-to-end.

---

## 7. API Endpoints (v1)

All routes prefixed with `/api/v1`, return the envelope `{ success: boolean, data?: T, error?: { code, message } }`. Protected routes require `Authorization: Bearer <supabase_access_token>`.

### Auth
| Method | Path | Purpose |
|---|---|---|
| `POST` | `/auth/signup` | Register with Purdue email + password; triggers email OTP |
| `POST` | `/auth/verify-email` | Verify 6-digit email OTP |
| `POST` | `/auth/phone/send-otp` | Submit `+1` phone; triggers SMS OTP |
| `POST` | `/auth/verify-phone` | Verify SMS OTP; returns session |
| `POST` | `/auth/login` | Email/password login |
| `POST` | `/auth/logout` | Invalidate session |
| `POST` | `/auth/resend-email-otp` | Rate-limited resend |
| `POST` | `/auth/resend-phone-otp` | Rate-limited resend |
| `GET`  | `/auth/me` | Current authenticated user |

### Users
| Method | Path | Purpose |
|---|---|---|
| `GET` | `/users/:id` | Public profile |
| `PATCH` | `/users/me` | Update own profile |

### Listings
| Method | Path | Purpose |
|---|---|---|
| `GET` | `/listings` | Paginated list (`?limit=20&offset=0`) |
| `GET` | `/listings/:id` | Single listing |
| `POST` | `/listings` | Create (auth + `fully_verified` required) |
| `PATCH` | `/listings/:id` | Owner-only update |
| `DELETE` | `/listings/:id` | Owner-only delete |

### Conventions (from backend-patterns)
- Resource-based URLs, plural nouns.
- Query params for pagination/sorting (ready for Feature A expansion).
- **Lean selects** — every repository method lists the exact columns it needs; no `select('*')`.
- **N+1 prevention** — listing reads that need owner info will batch-fetch users via a single `in('id', ownerIds)` query and hydrate in memory, not per row.

---

## 8. Layered Architecture (Repository + Service Pattern)

Applied directly from the backend-patterns skill.

```
Request → Route → Middleware Pipeline → Controller → Service → Repository → Supabase
                                                                   ↑
                                                            (swappable)
```

### Repositories (Data Access)
- `UserRepository` interface with `findById`, `findByEmail`, `updateProfile`, `markEmailVerified`, `markFullyVerified`.
- `ListingRepository` interface with `findAll(filters)`, `findById`, `findByIds` (for batch hydration), `create`, `update`, `delete`.
- Concrete `SupabaseUserRepository` / `SupabaseListingRepository` implementations hold all Supabase queries.
- Business logic **never** talks to Supabase directly — only via repositories. This makes swapping to Prisma or adding caching a one-file change.

### Services (Business Logic)
- `AuthService` — orchestrates Supabase Auth calls, verification state transitions, and repository writes.
- `UserService` — profile reads/writes, hydration helpers.
- `ListingService` — enforces `fully_verified` check before create, owner check before update/delete, pagination defaults, and batch hydration of owner data for list endpoints (N+1 prevention).

### Controllers (HTTP Adapters)
- Thin layer: parse/validate request (Zod), call service, return envelope. No business logic.

---

## 9. Middleware Pipeline

Composed per-route using the middleware pattern from backend-patterns.

- **`requestId`** — assigns a UUID per request, attached to logs.
- **`logger`** — structured JSON log on request start/end with `{ requestId, method, path, userId, durationMs }`.
- **`cors`** — restricted to frontend origin in prod.
- **`helmet`** — standard security headers.
- **`bodyParser`** — JSON only, size-limited.
- **`validate(schema)`** — Zod schema validator; any ZodError bubbles to the central error handler as HTTP 400.
- **`requireAuth`** — verifies Supabase JWT, loads user from `UserRepository`, attaches `req.user`. Throws `ApiError(401)` on failure.
- **`requireVerified`** — ensures `req.user.fully_verified === true` before write endpoints; throws `ApiError(403)` otherwise.
- **`requirePermission(permission)`** — RBAC wrapper for future admin routes; maps `user.role` to allowed permissions.
- **`rateLimit(max, windowMs)`** — applied to all OTP send/resend routes (3 per 10 minutes per email/phone).
- **`errorHandler`** — terminal middleware that normalizes `ApiError`, `ZodError`, and unknown errors into `{ success: false, error: { code, message } }`.

---

## 10. Error Handling

- **`ApiError` class** — `statusCode`, `message`, `code`, `isOperational`. Thrown from services/controllers.
- **Centralized `errorHandler`** — maps `ApiError` → typed response; maps `ZodError` → 400 with field-level `details`; logs and returns 500 for anything else.
- **`fetchWithRetry`** — exponential backoff (1s → 2s → 4s, max 3 attempts) wraps any flaky external calls (SMS gateway, future third-party APIs).
- **No silent catches** — every caught error is either rethrown as `ApiError` or logged with full context.

---

## 11. Rate Limiting

- `RateLimiter` class (in-memory Map of `identifier → timestamps[]`) for the demo phase.
- Applied to:
  - `POST /auth/signup` — 10 per IP per hour.
  - `POST /auth/verify-email`, `verify-phone` — 5 per identifier per 10 minutes.
  - `POST /auth/resend-email-otp`, `resend-phone-otp` — 3 per identifier per 10 minutes.
  - `POST /auth/login` — 10 per IP per 5 minutes.
- Upgrade path: swap `RateLimiter` implementation for a Redis-backed one with no callsite changes.

---

## 12. Background Jobs

- `JobQueue<T>` abstraction in place from day one even though the core product has no async workloads.
- Reserved for future use: sending transactional emails, indexing for Feature A search, enrichment for Feature D chatbot, analytics events for Feature E.
- Keeps the write path fast by pushing side-effects off the request cycle.

---

## 13. Observability (Structured Logging)

- `Logger` class emitting JSON lines: `{ timestamp, level, message, requestId, userId, method, path, durationMs, ...extras }`.
- **Required fields** on every log: `requestId`, `level`, `message`.
- **Error logs** include stack traces and the originating `ApiError.code`.
- Ready for shipping into any log aggregator (Datadog, Logtail, Grafana Loki) without code changes.

---

## 14. Project Structure

```
boilersub-backend/
├── src/
│   ├── index.ts                     # Express bootstrap + middleware wiring
│   ├── config/
│   │   ├── supabase.ts              # service-role + anon clients
│   │   └── env.ts                   # typed env loader
│   ├── middleware/
│   │   ├── requestId.ts
│   │   ├── logger.ts
│   │   ├── validate.ts              # Zod wrapper
│   │   ├── requireAuth.ts
│   │   ├── requireVerified.ts
│   │   ├── requirePermission.ts     # RBAC
│   │   ├── rateLimit.ts
│   │   └── errorHandler.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── users.routes.ts
│   │   └── listings.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── users.controller.ts
│   │   └── listings.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── users.service.ts
│   │   └── listings.service.ts
│   ├── repositories/
│   │   ├── user.repository.ts       # interface
│   │   ├── listing.repository.ts    # interface
│   │   ├── supabase.user.repository.ts
│   │   └── supabase.listing.repository.ts
│   ├── lib/
│   │   ├── ApiError.ts
│   │   ├── Logger.ts
│   │   ├── RateLimiter.ts
│   │   ├── JobQueue.ts
│   │   └── fetchWithRetry.ts
│   ├── schemas/                     # Zod schemas per endpoint
│   │   ├── auth.schema.ts
│   │   ├── users.schema.ts
│   │   └── listings.schema.ts
│   └── types/
│       └── index.ts
├── scripts/
│   └── seed.ts
├── migrations/
│   ├── 001_users.sql
│   ├── 002_listings.sql
│   ├── 003_indexes.sql
│   └── 004_rls_policies.sql
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 15. Environment Configuration

```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PORT=4000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

- Service-role key is server-only.
- Supabase dashboard setup required: email template → OTP mode; phone provider → Twilio credentials; site URL configured.

---

## 16. API Client Contract (Frontend Decoupling)

- Stable envelope `{ success, data | error }` on every response.
- Versioned under `/api/v1/...`.
- Frontend wraps all calls in one `apiClient.ts` module: configurable base URL, typed per-endpoint wrappers, centralized `Authorization` header injection. Route swaps or version bumps are a one-line change.

---

## 17. Success Criteria

- **Functional** — A Purdue student can sign up, verify email OTP, verify SMS OTP, log in, and CRUD listings entirely via Postman/curl against a live Supabase-backed backend.
- **Demo-ready** — Seeded mock users and listings are reachable through every read endpoint.
- **Pattern adherence** — Every feature flows through the route → middleware → controller → service → repository pipeline; no layer is skipped.
- **Extensible** — Features A–E drop into the existing structure without rewrites (verified by walking each feature's additions against current layers).
- **Observable** — Every request produces a structured log line with `requestId` correlation.
- **Hardened** — Purdue-email enforcement, `+1` phone enforcement, RLS at the DB layer, service-role key scoped to server, rate limits on sensitive routes.

---

## 18. Open Questions Before Implementation

1. **SMS provider** — Confirm Twilio (Supabase-recommended) vs MessageBird/Vonage.
2. **Supabase project provisioning** — URL and keys needed at implementation time, not design time.
3. **Profile fields** — Confirm whether `graduation_year`, `major`, `profile_picture_url` should be added to the initial schema.
4. **RBAC scope** — Is an `admin` role in scope for v1 moderation, or deferred entirely?

---

*This PRD applies the backend-patterns skill (Repository + Service layering, Middleware Pipeline, N+1 Prevention, Lean Selects, Centralized Error Handling, Retry with Backoff, JWT Validation, RBAC, Rate Limiting, Job Queues, Structured Logging) and is grounded in Supabase's official email/phone OTP documentation.*

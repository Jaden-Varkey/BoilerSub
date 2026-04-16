# BoilerSub Backend Reference

This document describes the current BoilerSub backend in implementation-level detail.

It is intended to be the primary reference when:

- implementing new backend features
- modifying existing auth, users, or listings flows
- debugging request behavior
- changing validation, persistence, or authorization rules
- migrating the backend to another runtime or data layer later

The document reflects the current integrated repository layout where the web app and API live in the same Next.js project, while backend logic lives under `server/` and is exposed through `app/api/v1/...`.

## 1. Current Backend Shape

BoilerSub no longer runs as a standalone Express server in the active repo layout.

Instead:

- the HTTP API is implemented as Next.js App Router route handlers under `app/api/v1`
- backend domain logic lives under `server/`
- the frontend talks to the backend on the same origin via `/api/v1/...`

Current backend execution path:

`HTTP request -> app/api/v1 route handler -> server/lib/withRoute.ts -> service -> repository -> Supabase`

This preserves the original layered architecture while removing the separate Express runtime.

## 2. Repository Layout

Backend-relevant files currently live in these directories:

### API entrypoints

- `app/api/v1/health/route.ts`
- `app/api/v1/auth/...`
- `app/api/v1/users/...`
- `app/api/v1/listings/...`

These files are thin transport adapters. They should stay small.

### Backend implementation

- `server/config/`
- `server/lib/`
- `server/repositories/`
- `server/schemas/`
- `server/services/`
- `server/types/`

### Supporting data/migrations/scripts

- `supabase/migrations/`
- `scripts/seed.ts`
- `scripts/reassign-listings-to-student2.ts`

## 3. Backend Responsibilities

The current backend is responsible for:

- Purdue-only signup enforcement
- email OTP verification
- optional phone verification flow
- login/logout/session handling through Supabase Auth
- JWT-authenticated user resolution
- user profile reads and updates
- listings read/create/update/delete
- verification gating for protected write actions
- request validation
- centralized error mapping
- rate limiting on auth-sensitive routes
- structured request logging

The backend is explicitly not yet responsible for:

- search/filter ranking
- chat/messaging
- appointments
- reviews
- payments
- escrow
- recommendation systems
- image upload/storage pipeline beyond the current listing payload format

## 4. Environment and Configuration

Current environment parsing lives in:

- `server/config/env.ts`

Environment variables used by the backend:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_API_KEY` (optional, only for Stitch tooling)
- `GOOGLE_STITCH_MODEL`
- `NODE_ENV`
- `LOG_LEVEL`
- `SKIP_PHONE_VERIFICATION`
- `NEXT_PUBLIC_API_BASE_URL` is frontend-facing, but relevant because the frontend points to this backend

Important behavior:

- `dotenv.config({ override: true })` is used
- `SKIP_PHONE_VERIFICATION` is parsed as a boolean transform from `"true" | "false"`

Operational note:

- `SKIP_PHONE_VERIFICATION=true` changes the auth flow materially
- when enabled, successful email verification promotes the user directly to fully verified and may return a session immediately

Do not change this behavior casually, because it directly affects onboarding and test/dev flows.

## 5. Supabase Clients

Supabase client construction lives in:

- `server/config/supabase.ts`

There are three exported pieces:

- `supabaseServiceClient`
- `supabaseAnonClient`
- `createSupabaseClient(accessToken?)`

### `supabaseServiceClient`

Purpose:

- trusted server-side data operations
- repository reads/writes to `users` and `listings`

Uses:

- `SUPABASE_SERVICE_ROLE_KEY`

Implication:

- bypasses user-scoped client restrictions
- must only be used in controlled backend code

### `supabaseAnonClient`

Purpose:

- validate and introspect user JWTs through Supabase Auth

Uses:

- `SUPABASE_ANON_KEY`

### `createSupabaseClient(accessToken?)`

Purpose:

- create a request-scoped client with an `Authorization` header if needed
- useful if future routes need RLS-enforced reads under the user token

Current implementation note:

- most repository operations currently use the service-role client, not the request-scoped client

## 6. Domain Types

Shared backend types live in:

- `server/types/index.ts`

Important types:

- `Role`
- `ApiErrorBody`
- `ApiResponse<T>`
- `RequestUser`
- `UserRecord`
- `PublicUser`
- `ListingRecord`
- `ListingWithOwner`
- `AuthSessionPayload`
- `AppUser`

### `RequestUser`

Represents the authenticated application-level user attached after auth resolution.

Fields:

- `id`
- `email`
- `phone`
- `full_name`
- `bio`
- `email_verified`
- `phone_verified`
- `fully_verified`
- `role`

### `UserRecord`

`RequestUser` plus timestamps:

- `created_at`
- `updated_at`

### `ListingRecord`

Core persisted listing shape:

- `id`
- `owner_id`
- `title`
- `description`
- `price`
- `start_date`
- `end_date`
- `bedrooms`
- `bathrooms`
- `distance`
- `address`
- `amenities`
- `images`
- `created_at`
- `updated_at`

### `ListingWithOwner`

Used for listing feeds where owner data is included.

Adds:

- `owner.id`
- `owner.full_name`
- `owner.email`
- `owner.phone`
- `owner.fully_verified`

## 7. Error Model

Custom backend errors live in:

- `server/lib/apiError.ts`

`ApiError` contains:

- `statusCode`
- `code`
- `message`
- `details`
- `isOperational`

This is the canonical way to signal intentional application failures.

Examples:

- `new ApiError(401, "unauthorized", "Missing authorization token")`
- `new ApiError(403, "verification_required", "Fully verified account required")`
- `new ApiError(404, "listing_not_found", "Listing not found")`

Rules:

- throw `ApiError` for expected business and auth failures
- let `withRoute` translate it into the API envelope
- do not return ad hoc error JSON from services or repositories

## 8. Response Envelope

Response helpers live in:

- `server/lib/envelope.ts`

All API responses follow this structure:

### Success

```json
{
  "success": true,
  "data": { ... }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "some_code",
    "message": "Human-readable error",
    "details": {}
  }
}
```

Primary helpers:

- `successEnvelope`
- `errorEnvelope`
- `jsonSuccess`
- `jsonError`

When adding routes, maintain this envelope exactly.

## 9. Logging

Structured logging lives in:

- `server/lib/logger.ts`

The logger emits JSON lines with:

- `timestamp`
- `level`
- `message`
- contextual fields added by the caller

`withRoute` currently logs:

- `request_completed`
- `request_failed`
- `validation_failed`
- `unhandled_error`

Expected contextual fields include:

- `requestId`
- `method`
- `path`
- `status`
- `userId`
- `durationMs`

This logger is intentionally minimal and can be replaced later without changing service/repository logic.

## 10. Rate Limiting

Rate limiting lives in:

- `server/lib/rateLimiter.ts`

Current implementation:

- in-memory map of request timestamps per identifier
- no Redis or shared-store backing
- valid for local/dev and small single-instance usage

Methods:

- `checkLimit(identifier, maxRequests, windowMs)`
- `consume(identifier, maxRequests, windowMs)`

Important limitation:

- limits are per-process only
- if the app scales horizontally, rate limits will no longer be globally correct

Current route-level rate limiting is implemented through `withRoute` options, not standalone middleware.

## 11. Route Wrapper: `withRoute`

The most important backend transport utility is:

- `server/lib/withRoute.ts`

This file replaces most of what Express middleware used to do.

### Responsibilities

`withRoute` handles:

- request ID generation
- JSON body parsing
- query parsing
- params parsing
- optional auth resolution
- optional verification gating
- optional rate limiting
- Zod validation
- centralized error-to-response mapping
- structured request logging

### Request lifecycle

For each request:

1. generate `requestId`
2. read `pathname` and `method`
3. parse body if JSON
4. build raw query from `request.nextUrl.searchParams`
5. read route params
6. authenticate if `requireAuth` or `requireVerified`
7. enforce `fully_verified` if requested
8. apply rate limit if configured
9. validate body/query/params through Zod if schemas are supplied
10. call the route handler
11. log success or failure
12. return a response in the standard envelope

### Auth resolution in `withRoute`

`authenticate(request)` does:

- read `Authorization: Bearer <token>`
- call `supabaseAnonClient.auth.getUser(accessToken)`
- upsert the application user through `userRepository.upsertAuthUser(...)`
- return both:
  - `user`
  - `auth { accessToken, userId }`

This means every authenticated request refreshes application user presence in the `users` table.

### Validation behavior

Schemas are supplied with:

- `bodySchema`
- `querySchema`
- `paramsSchema`

Zod failures return:

- `400`
- `code = "validation_failed"`

### Dynamic route behavior

All API route files currently export:

```ts
export const dynamic = "force-dynamic";
```

This is important in Next.js because the route wrapper reads request-bound data and must not be statically optimized.

Do not remove this unless you intentionally redesign the route behavior.

## 12. Dependency Container

Backend dependency wiring lives in:

- `server/lib/container.ts`

This constructs singleton instances of:

- `userRepository`
- `listingRepository`
- `authService`
- `usersService`
- `listingsService`

This keeps route files thin and avoids repeated manual instantiation.

If you add new repositories or services, wire them here.

## 13. Validation Schemas

Schemas are under:

- `server/schemas/auth.schema.ts`
- `server/schemas/users.schema.ts`
- `server/schemas/listings.schema.ts`

These are the source of truth for API input validation.

### Auth schemas

#### `purdueEmailSchema`

- valid email
- must match `@purdue.edu`

#### `phoneSchema`

- must match `^\+1\d{10}$`

#### Request bodies

- `signupSchema`
- `verifyEmailSchema`
- `sendPhoneOtpSchema`
- `verifyPhoneSchema`
- `loginSchema`
- `resendEmailOtpSchema`
- `resendPhoneOtpSchema`

### Users schemas

- `userIdParamSchema`
- `updateMeSchema`

`updateMeSchema` currently allows:

- `full_name`
- `bio`
- `phone`

However, current service/repository usage is mostly focused on `full_name` and `bio`.

### Listings schemas

#### `listingCreateSchema`

Required/validated:

- `title`
- `price`
- `start_date`
- `images`

Optional/nullable:

- `description`
- `end_date`
- `bedrooms`
- `bathrooms`
- `distance`
- `address`
- `amenities`

Special note on images:

- images must be JPEG data URLs
- regex currently expects `data:image/jpeg;base64,...`
- create requires `1..10` images

This is strict and can become a source of validation failures if frontend behavior changes.

#### `listingUpdateSchema`

- partial version of create schema

#### `listingListQuerySchema`

- `limit`: integer, `1..100`, default `20`
- `offset`: integer, `>= 0`, default `0`

## 14. Repository Layer

Repositories define all persistence logic.

### User repository interface

File:

- `server/repositories/user.repository.ts`

Methods:

- `findById`
- `findByEmail`
- `findByIds`
- `upsertAuthUser`
- `updateProfile`
- `markEmailVerified`
- `markPhoneVerified`
- `markFullyVerified`

### Supabase user repository

File:

- `server/repositories/supabase.user.repository.ts`

Behavior:

- uses service-role client
- maps database rows into `UserRecord`
- throws `ApiError` on Supabase failures

Important details:

- `upsertAuthUser` inserts or updates by `id`
- `markFullyVerified` sets:
  - `email_verified: true`
  - `phone_verified: true`
  - `fully_verified: true`

This method is critical in both dev shortcut flows and normal verification completion.

### Listing repository interface

File:

- `server/repositories/listing.repository.ts`

Methods:

- `findAll`
- `findById`
- `findByIds`
- `create`
- `update`
- `delete`
- `findWithOwners`

### Supabase listing repository

File:

- `server/repositories/supabase.listing.repository.ts`

Behavior:

- uses service-role client
- maps listing rows into `ListingRecord`
- fetches owners separately for list hydration

Important implementation detail:

- `findWithOwners` avoids per-row owner queries
- it loads all unique `owner_id`s in one user query
- it builds an in-memory `ownerMap`
- it returns a hydrated array of `ListingWithOwner`

This is the current N+1 prevention mechanism.

## 15. Service Layer

Services contain business logic and should remain the main place for behavioral rules.

### Auth service

File:

- `server/services/auth.service.ts`

This service talks directly to Supabase Auth over HTTP via:

- `authRequest<T>(path, init, accessToken?)`

It does not rely exclusively on high-level helper methods from the Supabase JS SDK.

#### Methods

##### `signup(email, password)`

Behavior:

- POST `/auth/v1/signup` to Supabase
- upsert auth user into `users` if an ID is returned
- return:
  - `status: "pending_email_verification"`
  - `userId`

##### `verifyEmail(email, token)`

Behavior:

- POST `/auth/v1/verify`
- verify email OTP

Branches:

- if `SKIP_PHONE_VERIFICATION=true`
  - mark user fully verified
  - return `{ session, user }`
- otherwise
  - mark email verified
  - return `{ status: "pending_phone_verification" }`

##### `sendPhoneOtp({ accessToken, phone })`

Behavior:

- authenticated request
- PUT `/auth/v1/user`
- updates phone on the auth user
- triggers SMS OTP through Supabase/Twilio-configured auth backend

Returns:

- `status: "pending_phone_verification"`

##### `verifyPhone(phone, token)`

Behavior:

- POST `/auth/v1/verify`
- verifies SMS OTP
- marks user fully verified
- returns `{ session, user }`

##### `login(email, password)`

Behavior:

- POST `/auth/v1/token?grant_type=password`
- requires the application user to exist
- rejects login if `fully_verified` is false

This is important:

- successful auth at Supabase level is not enough
- the app layer also requires a fully verified user record

##### `logout(accessToken)`

Behavior:

- POST `/auth/v1/logout`
- signs out through Supabase

Operational nuance:

- refresh token is revoked
- an already-issued access token may remain usable until expiry depending on Supabase semantics

Do not assume logout immediately invalidates the current bearer JWT for all subsequent calls.

##### `resendEmailOtp(email)`

Behavior:

- POST `/auth/v1/resend`
- `{ type: "signup", email }`

##### `resendPhoneOtp(phone)`

Behavior:

- POST `/auth/v1/resend`
- `{ type: "sms", phone }`

### Users service

File:

- `server/services/users.service.ts`

Methods:

- `getUserById(id)`
- `updateMe(userId, input)`

Behavior:

- converts internal `UserRecord` into `PublicUser`
- throws `user_not_found` if the user does not exist

### Listings service

File:

- `server/services/listings.service.ts`

Methods:

- `list(filters)`
- `getById(id)`
- `create(user, payload)`
- `update(user, id, payload)`
- `delete(user, id)`

Important rules:

- listing writes require `fully_verified`
- update/delete require owner match unless `role === "admin"`
- `getById` throws `listing_not_found` on missing records
- `create` normalizes several optional fields to `null`

Private helper:

- `assertFullyVerified(userId)`

This method re-reads the user from the repository and enforces current verification state before writes.

## 16. API Endpoints

All API routes are under:

- `app/api/v1`

### Health

- `GET /api/v1/health`

Purpose:

- basic liveness check

Response:

```json
{ "success": true, "data": { "status": "ok" } }
```

### Auth routes

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/phone/send-otp`
- `POST /api/v1/auth/verify-phone`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/resend-email-otp`
- `POST /api/v1/auth/resend-phone-otp`
- `GET /api/v1/auth/me`

Current protections:

- signup/login/resend/verify routes have route-level rate limits as configured in each handler
- `send-otp`, `logout`, and `me` require auth

### Users routes

- `GET /api/v1/users/[id]`
- `PATCH /api/v1/users/me`

Current protections:

- `GET /users/[id]` requires auth
- `PATCH /users/me` requires auth and fully verified user

### Listings routes

- `GET /api/v1/listings`
- `POST /api/v1/listings`
- `GET /api/v1/listings/[id]`
- `PATCH /api/v1/listings/[id]`
- `DELETE /api/v1/listings/[id]`

Current protections:

- listing reads require auth
- listing writes require auth and fully verified user

## 17. Route-Level Rate Limits

Current rate limits are defined directly inside route files.

### Signup

- `10` per identifier per hour
- key source: forwarded IP when available

### Verify email

- `5` per email per 10 minutes

### Send phone OTP

- `3` per phone per 10 minutes

### Verify phone

- `5` per phone per 10 minutes

### Login

- `10` per identifier per 5 minutes

### Resend email OTP

- `3` per email per 10 minutes

### Resend phone OTP

- `3` per phone per 10 minutes

## 18. Authorization Rules

Current authorization model is simple.

### Authenticated-only access

Requires valid bearer token:

- all listings read routes
- `/auth/me`
- `/users/[id]`

### Fully verified access

Requires:

- valid bearer token
- `user.fully_verified === true`

Applies to:

- `POST /listings`
- `PATCH /listings/[id]`
- `DELETE /listings/[id]`
- `PATCH /users/me`

### Owner-only mutations

For listings update/delete:

- `existing.owner_id` must equal `user.id`
- or `user.role` must be `admin`

## 19. Database Model and Migrations

Database migrations live in:

- `supabase/migrations/`

Known migration files:

- `001_users.sql`
- `002_listings.sql`
- `003_indexes.sql`
- `004_rls_policies.sql`
- `005_listing_images.sql`
- `006_listing_distance.sql`
- `007_listing_end_date_nullable.sql`

This tells you the backend has already evolved past the earlier PRD:

- `images` exists on listings
- `distance` exists on listings
- `end_date` is nullable

When modifying repositories or validation, use the actual current schema, not only the original plan docs.

## 20. Seeding and Test Data

Seed script:

- `scripts/seed.ts`

Current behavior:

- creates auth users through Supabase admin API
- marks them email/phone confirmed
- upserts matching rows into `users`
- inserts listings owned by seeded users

Current seeded login used in local verification:

- `student2@purdue.edu`
- password: `BoilerSub123!`

Important:

- this is dev/test seed behavior
- do not rely on these values in production code

## 21. Backend Modification Guidelines

Use these rules when changing the backend.

### Add new endpoint

1. add or reuse schema in `server/schemas`
2. add service method in `server/services`
3. add repository method if persistence changes are needed
4. create route file under `app/api/v1/...`
5. wrap with `withRoute`
6. configure auth/verification/rate limit in the route
7. keep response envelope standard

### Change business behavior

Prefer changing:

- service layer first

Avoid putting business rules in:

- route files
- repository methods

### Change persistence behavior

Prefer changing:

- repository methods

Avoid embedding Supabase queries directly in:

- route files
- frontend code

### Add new validation

Add it in:

- `server/schemas/...`

Then wire it through `withRoute`.

### Add role-based admin behavior

Current role support already exists in types and listing mutation checks.

If adding admin routes:

- keep role checks in services or route authorization configuration
- do not hardcode role logic in the frontend

## 22. Known Constraints and Caveats

These are important for anyone modifying the backend.

### 1. Same-origin API assumption

The active frontend now defaults to:

- `NEXT_PUBLIC_API_BASE_URL=/api/v1`

If backend paths change, the frontend client must also change.

### 2. Logout semantics

Logging out through Supabase does not necessarily make the current access token instantly unusable.

### 3. In-memory rate limiting

Rate limiting is not distributed.

### 4. Service-role repositories

Most data queries currently use the service-role client.

That is simpler operationally, but it means app-layer authorization is essential.

### 5. Images are validation-only data URLs today

The backend currently accepts JPEG data URLs in listing payloads.

There is no dedicated image storage pipeline documented here.

### 6. Query params are read by `withRoute`

That means API routes are intentionally dynamic in Next.

### 7. Reference docs may lag implementation

`PLAN2.md` is useful, but current code has additional fields and slightly different runtime architecture.

Always reconcile changes with the code under `server/`.

## 23. Current Safe Backend Invariants

As of now, these behaviors should be treated as invariants unless intentionally redesigned:

- all API responses use the standard success/error envelope
- all protected routes use bearer token auth
- listings writes require fully verified users
- listing update/delete are owner-only except admin
- auth flow is Purdue-email constrained
- validation is schema-driven through Zod
- repositories are the only place Supabase table queries should live
- services are the main home for business logic
- route files should stay thin
- API routes are dynamic, not statically generated

## 24. Quick Reference

### Core backend files

- `server/lib/withRoute.ts`
- `server/services/auth.service.ts`
- `server/services/users.service.ts`
- `server/services/listings.service.ts`
- `server/repositories/supabase.user.repository.ts`
- `server/repositories/supabase.listing.repository.ts`
- `server/config/env.ts`
- `server/config/supabase.ts`

### Core API files

- `app/api/v1/auth/...`
- `app/api/v1/users/...`
- `app/api/v1/listings/...`
- `app/api/v1/health/route.ts`

### Supporting files

- `scripts/seed.ts`
- `supabase/migrations/...`

## 25. Summary

The BoilerSub backend is a layered TypeScript API built around:

- Next.js route handlers for transport
- `withRoute` for request orchestration
- service classes for business logic
- repository classes for persistence
- Supabase for auth and data

If you need to modify the backend safely, the main rule is:

- change behavior in services
- change persistence in repositories
- change validation in schemas
- keep route files thin

That separation is the main reason the backend remains understandable and replaceable.

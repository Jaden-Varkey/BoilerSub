# BoilerSub Backend Integration Plan

This document describes the backend-specific changes required to integrate the current split BoilerSub setup into one complete Next.js project that can be deployed to Vercel without changing user-facing functionality.

It is based on:

- the current Documents workspace at `/Users/archeet/Documents/BoilerSub-reference`
- the actual backend source under `src/`
- the actual frontend source under `boilersub-frontend/src/`
- the current Supabase-backed auth and data model
- `graphify-out/graph.json`, which confirms the backend is already decomposed into config, middleware, controllers, services, and repositories

## 1. Current State

The codebase is currently split into two runnable apps:

- backend: Express + TypeScript at the repo root
- frontend: Next.js 14 app in `boilersub-frontend/`

Current runtime:

- frontend serves on `localhost:3000`
- backend serves on `localhost:4000`
- frontend calls backend over HTTP via `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1`

Current backend architecture:

`Express route -> middleware -> controller -> service -> repository -> Supabase`

Current frontend integration boundary:

- all frontend API access goes through `boilersub-frontend/src/lib/apiClient.ts`
- the frontend does not talk to Supabase directly
- auth state is browser-managed through localStorage and Bearer tokens

This is a good migration starting point because the split is mostly a transport/process split, not a domain-logic split.

## 2. What Must Not Change

The integration should preserve these invariants:

- the UI must not change at all
- no visual styling, layout, spacing, typography, motion, assets, or interaction design may be modified
- no frontend page behavior may be changed except what is strictly required to keep the exact existing behavior working in the integrated runtime
- no feature may be added, removed, simplified, reinterpreted, or behaviorally modified
- keep the API contract under `/api/v1/...`
- keep the response envelope shape: `{ success: true, data }` and `{ success: false, error }`
- keep Supabase as the source of truth for auth, users, listings, and RLS
- keep service-role usage server-only
- keep current auth semantics:
  - Purdue-only signup
  - email OTP verification
  - optional demo skip for phone verification
  - Bearer-token auth for protected endpoints
- keep current listing CRUD semantics and ownership checks
- keep the frontend consuming one centralized API client

If these remain stable, the frontend behavior should remain effectively unchanged.

### Non-Negotiable Integration Constraint

This integration is an infrastructure and transport migration only.

It is not a redesign.
It is not a refactor of user-facing behavior.
It is not a feature pass.

The entire existing UI must stay exactly as it is.

That means:

- no page redesigns
- no component redesigns
- no copy rewrites unless required by a broken runtime dependency
- no changed flows
- no changed route behavior
- no changed auth UX
- no changed listings UX
- no changed profile UX

If a frontend file must be touched during integration, the change must be limited to what is strictly necessary to preserve the exact existing UI and feature behavior inside the new single-project deployment model.

## 3. Graphify-Out Findings

`graphify-out` is useful but partially stale:

- `GRAPH_REPORT.md` is about the Stitch design corpus, not the runtime app architecture
- `graph.json` is the useful file for migration planning
- `graph.json` points to older Desktop paths, but the code structure it describes still matches the Documents backend

What `graph.json` confirms:

- `src/index.ts` is the transport composition root
- middleware is isolated:
  - `createRequireAuth`
  - `createRateLimit`
  - `createValidator`
  - `errorHandler`
- repositories are isolated:
  - `SupabaseUserRepository`
  - `SupabaseListingRepository`
- services are isolated:
  - `AuthService`
  - `UsersService`
  - `ListingsService`
- routes are thin transport wiring:
  - `auth.routes.ts`
  - `users.routes.ts`
  - `listings.routes.ts`

That means the migration target is clear: move the transport layer into Next route handlers and reuse nearly everything below it.

## 4. Target End State

The final integrated project should look like this:

```text
BoilerSub/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── health/route.ts
│   │       ├── auth/
│   │       │   ├── signup/route.ts
│   │       │   ├── verify-email/route.ts
│   │       │   ├── phone/send-otp/route.ts
│   │       │   ├── verify-phone/route.ts
│   │       │   ├── login/route.ts
│   │       │   ├── logout/route.ts
│   │       │   ├── resend-email-otp/route.ts
│   │       │   ├── resend-phone-otp/route.ts
│   │       │   └── me/route.ts
│   │       ├── users/
│   │       │   ├── [id]/route.ts
│   │       │   └── me/route.ts
│   │       └── listings/
│   │           ├── route.ts
│   │           └── [id]/route.ts
│   └── ...frontend routes...
├── server/
│   ├── config/
│   ├── controllers/
│   ├── lib/
│   ├── repositories/
│   ├── schemas/
│   ├── services/
│   └── transport/
└── package.json
```

Transport goal:

`Next Route Handler -> shared route wrapper -> service -> repository -> Supabase`

Express should disappear from the runtime path.

## 5. Required Backend Changes

### 5.1 Replace `src/index.ts` with Next route handlers

Current `src/index.ts` does all of this:

- instantiates repositories and services
- configures helmet/cors/json parsing
- mounts `/health`
- mounts `/api/v1/auth`
- mounts `/api/v1/users`
- mounts `/api/v1/listings`
- installs terminal error middleware

In the integrated app:

- delete the Express server bootstrap from runtime use
- re-express each endpoint as a file in `app/api/v1/.../route.ts`
- move dependency instantiation into shared server-only modules

Concrete change:

- stop using `app.listen(env.PORT)`
- stop using Express router mounting
- replace each route file with a direct handler exporting `GET`, `POST`, `PATCH`, or `DELETE`

### 5.2 Preserve services and repositories with minimal changes

These files are already reusable:

- `src/services/auth.service.ts`
- `src/services/users.service.ts`
- `src/services/listings.service.ts`
- `src/repositories/supabase.user.repository.ts`
- `src/repositories/supabase.listing.repository.ts`
- `src/config/supabase.ts`
- `src/config/env.ts`

Recommended move:

- relocate these under `server/`
- keep filenames and class boundaries largely unchanged

Example:

- `src/services/auth.service.ts` -> `server/services/auth.service.ts`
- `src/repositories/supabase.user.repository.ts` -> `server/repositories/supabase.user.repository.ts`

Reason:

- these files contain the real business logic and Supabase integration
- they are not tightly coupled to Express except through input/output types

### 5.3 Replace Express middleware with framework-neutral server helpers

Current middleware:

- `requestId.ts`
- `logger.ts`
- `rateLimit.ts`
- `validate.ts`
- `requireAuth.ts`
- `requireVerified.ts`
- `errorHandler.ts`
- `asyncHandler.ts`

These should not be ported 1:1 as Express middleware. They should be converted into plain functions usable inside Next route handlers.

Required transformations:

#### `requireAuth`

Current form:

- Express `RequestHandler`
- reads `Authorization` header from `req.headers.authorization`
- calls Supabase `auth.getUser(accessToken)`
- upserts the user
- mutates `req.auth` and `req.user`

Target form:

- `authenticate(request: NextRequest | Request): Promise<{ accessToken: string; user: UserRecord }>`
- returns data instead of mutating request objects

#### `requireVerified`

Current form:

- depends on `req.user`

Target form:

- plain assertion helper:
  - `assertVerified(user: UserRecord): void`
  - or enforce via route wrapper option

#### `validate`

Current form:

- parses `req.body`, `req.query`, or `req.params`

Target form:

- route-local helper functions:
  - `parseJsonBody(request, schema)`
  - `parseQuery(searchParams, schema)`
  - `parseRouteParams(params, schema)`

#### `rateLimit`

Current form:

- in-memory limiter keyed by IP, email, or phone

Target form:

- can remain temporarily as a plain function for development
- for production on Vercel, in-memory storage is not reliable across instances

This is one of the few backend pieces that needs a real production change, not just a transport rewrite.

Required production action:

- replace in-memory rate limiting with a shared store:
  - Upstash Redis
  - Vercel KV equivalent
  - Supabase-backed rate-limit table if necessary

#### `errorHandler`

Current form:

- Express terminal middleware

Target form:

- a shared `withRoute()` wrapper that:
  - catches `ApiError`
  - catches `ZodError`
  - logs unknown errors
  - returns `NextResponse.json(...)`

### 5.4 Add a shared route wrapper for Next handlers

This is the most important backend integration primitive.

Create a server helper, for example:

- `server/lib/withRoute.ts`

Responsibilities:

- assign request ID
- optionally parse auth
- optionally require verified user
- normalize error responses
- normalize success envelope
- centralize logging

It should replace the role currently played by:

- `asyncHandler`
- `errorHandler`
- parts of `requestId`
- parts of `logger`
- parts of `requireAuth`
- parts of `requireVerified`

Recommended signature:

```ts
withRoute(
  {
    requireAuth?: boolean,
    requireVerified?: boolean,
  },
  async ({ request, user, accessToken, params }) => { ... }
)
```

### 5.5 Move `/health` to a Next route

Current route:

- `GET /health`

Recommended integrated state:

- keep `GET /health` only if a rewrite is required externally
- add canonical Vercel-ready route:
  - `GET /api/v1/health`

Prefer:

- `app/api/v1/health/route.ts`

This aligns health with the main API namespace and avoids needing a second server entrypoint.

### 5.6 Convert each Express route group to route files

Current route groups:

- `src/routes/auth.routes.ts`
- `src/routes/users.routes.ts`
- `src/routes/listings.routes.ts`

Target route files:

- `app/api/v1/auth/signup/route.ts`
- `app/api/v1/auth/verify-email/route.ts`
- `app/api/v1/auth/phone/send-otp/route.ts`
- `app/api/v1/auth/verify-phone/route.ts`
- `app/api/v1/auth/login/route.ts`
- `app/api/v1/auth/logout/route.ts`
- `app/api/v1/auth/resend-email-otp/route.ts`
- `app/api/v1/auth/resend-phone-otp/route.ts`
- `app/api/v1/auth/me/route.ts`
- `app/api/v1/users/[id]/route.ts`
- `app/api/v1/users/me/route.ts`
- `app/api/v1/listings/route.ts`
- `app/api/v1/listings/[id]/route.ts`

Per-file behavior:

- route file does transport work only
- schema parsing stays explicit
- service call stays unchanged where possible

### 5.7 Keep `AuthService` on the server, unchanged in principle

`AuthService` is already server-friendly:

- it uses direct HTTP calls to Supabase Auth
- it depends on env vars and a repository
- it does not depend on Express

Changes needed:

- update imports after moving files
- ensure it only runs in Node runtime route handlers

Recommended route setting:

```ts
export const runtime = "nodejs";
```

Apply this to all API routes that rely on:

- service-role secret access
- Node-oriented libraries
- current server-only modules

### 5.8 Keep repository code server-only

Current repositories use:

- `supabaseServiceClient`
- service-role key

These must remain inaccessible to the browser bundle.

Required safeguards:

- move them under a clearly server-only folder such as `server/`
- never import them from client components
- never reference service-role env vars from any file imported by the frontend

### 5.9 Consolidate environment handling

Current split env model:

- backend `.env`
- frontend `.env.local`

Target integrated env model:

- one project env source in development
- one Vercel project env config in deployment

Required changes:

- keep server secrets:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SKIP_PHONE_VERIFICATION`
  - `LOG_LEVEL`
- change frontend API base behavior:
  - `NEXT_PUBLIC_API_BASE_URL` should default to `/api/v1`
  - not `http://localhost:4000/api/v1`

This is the key frontend-facing backend integration change.

### 5.10 Remove CORS as a first-class runtime concern

Current backend depends on:

- `cors({ origin: env.CORS_ORIGIN, credentials: true })`

In the integrated app:

- frontend and backend share origin
- CORS is no longer needed for the web app itself

Action:

- remove runtime CORS dependency from the main app path
- only add cross-origin handling later if a mobile app or external client truly needs it

### 5.11 Remove Express-only dependencies after migration

Current backend runtime packages include:

- `express`
- `cors`
- `helmet`
- `@types/express`

After migration, these should be removable from the integrated project unless retained temporarily during transition.

What replaces them:

- Express routing -> Next App Router route handlers
- CORS -> same-origin deployment
- helmet -> Next/Vercel headers config where needed

### 5.12 Logging should be preserved, not dropped

Current logger:

- structured JSON logging
- request start / finish
- request ID

Keep:

- `src/lib/logger.ts` logic

Change:

- move request log emission into `withRoute()`
- emit one structured completion event per route invocation

Recommended logged fields:

- `requestId`
- `method`
- `path`
- `status`
- `durationMs`
- `userId`

### 5.13 Revisit body-size handling

Current backend:

- `express.json({ limit: "25mb" })`

In Next route handlers:

- request parsing is different
- large base64 image payloads sent through listing create/edit routes need explicit attention

This matters because the frontend currently supports image handling and may submit base64 image strings in listing payloads.

Required decision:

- either keep the current payload model and verify it fits Next/Vercel limits
- or move image upload to Supabase Storage direct upload / signed URLs

For Vercel, the second option is the safer long-term backend direction.

### 5.14 Keep database migrations unchanged

The Supabase schema is already independent of Express:

- `001_users.sql`
- `002_listings.sql`
- `004_rls_policies.sql`
- `005_listing_images.sql`
- `006_listing_distance.sql`
- `007_listing_end_date_nullable.sql`

No migration-layer change is required just because the server transport changes.

Backend integration impact on Supabase:

- none at the schema level
- none at the auth-provider level
- only at the server runtime and env wiring level

## 6. Required Frontend-Adjacent Backend Changes

These are backend-driven but visible at the integration boundary.

### 6.1 Change default API base URL

Current:

- `http://localhost:4000/api/v1`

Target:

- `/api/v1`

Reason:

- same-origin deployment on Vercel
- no split frontend/backend domains needed

### 6.2 Preserve all route paths exactly

Current frontend pages and hooks assume:

- `/auth/signup`
- `/auth/verify-email`
- `/auth/phone/send-otp`
- `/auth/verify-phone`
- `/auth/login`
- `/auth/logout`
- `/auth/resend-email-otp`
- `/auth/resend-phone-otp`
- `/auth/me`
- `/users/:id`
- `/users/me`
- `/listings`
- `/listings/:id`

Under integration:

- these must remain the same under `/api/v1`

If the paths change, the frontend will need broader edits than necessary.

### 6.3 Preserve response shapes exactly

Examples that must remain stable:

- signup -> `{ status, userId }`
- verifyEmail -> `{ status }` or `{ session, user }`
- login -> `{ session, user }`
- auth me -> `{ user }`
- delete listing -> `{ ok: true }`

Do not “improve” the payload shapes during migration unless the frontend is updated in lockstep.

## 7. Production Risks Specific to Vercel

### 7.1 In-memory rate limiting is not production-safe

Current limiter:

- in-process memory map

Problem on Vercel:

- stateless/serverless execution
- multiple concurrent instances
- no shared memory

Required fix:

- replace with shared persistent or distributed storage

### 7.2 Long-lived server assumptions must be removed

Current Express app assumes:

- one long-running process
- boot-time dependency construction

Next/Vercel route handlers are request-driven.

Implication:

- services and repositories should be created through shared module-level singletons or lightweight factories
- avoid relying on process lifecycle hooks

### 7.3 Large request bodies may be a problem

If listing image payloads are transmitted as base64 in JSON:

- this is a deployment risk on Vercel

Preferred production backend change:

- direct upload to Supabase Storage
- backend issues signed upload URLs or stores only metadata

### 7.4 Secret leakage must be actively prevented

The biggest non-functional risk in the integration is accidental import leakage.

Rules:

- no service-role access in any client component
- no `NEXT_PUBLIC_` prefix on sensitive values
- audit imports after migration to ensure `server/` code is not reachable from client bundles

## 8. Recommended Migration Sequence

### Phase 1: Create the integrated project shell

- use the repo root as the single Next app
- move `boilersub-frontend/src/app` into root `app` or root `src/app`
- move shared frontend code into root `src/`
- add Next config at the root

### Phase 2: Move backend internals to `server/`

- move `src/config`, `src/lib`, `src/repositories`, `src/services`, `src/schemas`
- keep code behavior unchanged
- fix imports only

### Phase 3: Add `withRoute()` and transport helpers

- create shared helpers for:
  - auth
  - validation
  - request IDs
  - error mapping
  - logging

### Phase 4: Port endpoints one group at a time

Suggested order:

1. `GET /api/v1/health`
2. auth routes
3. users routes
4. listings routes

This minimizes frontend breakage risk.

### Phase 5: Switch frontend API base to relative

- default `BASE_URL` to `/api/v1`
- remove split-origin assumptions

### Phase 6: Remove Express runtime

- remove `src/index.ts` from active use
- remove router mounting model
- remove obsolete dependencies

### Phase 7: Production hardening for Vercel

- replace in-memory rate limiter
- validate request body size strategy
- verify all API routes use `runtime = "nodejs"`
- verify secrets are server-only

## 9. Concrete File-Level Change List

### Files to retire from runtime use

- `src/index.ts`
- `src/routes/auth.routes.ts`
- `src/routes/users.routes.ts`
- `src/routes/listings.routes.ts`

### Files to convert from Express middleware to plain helpers

- `src/middleware/requireAuth.ts`
- `src/middleware/requireVerified.ts`
- `src/middleware/validate.ts`
- `src/middleware/rateLimit.ts`
- `src/middleware/errorHandler.ts`
- `src/middleware/logger.ts`
- `src/middleware/requestId.ts`
- `src/middleware/asyncHandler.ts`

### Files to preserve largely as-is

- `src/services/auth.service.ts`
- `src/services/users.service.ts`
- `src/services/listings.service.ts`
- `src/repositories/supabase.user.repository.ts`
- `src/repositories/supabase.listing.repository.ts`
- `src/repositories/user.repository.ts`
- `src/repositories/listing.repository.ts`
- `src/config/env.ts`
- `src/config/supabase.ts`
- `src/lib/apiError.ts`
- `src/lib/envelope.ts`
- `src/lib/logger.ts`
- `src/schemas/auth.schema.ts`
- `src/schemas/users.schema.ts`
- `src/schemas/listings.schema.ts`

### Files to add

- `app/api/v1/health/route.ts`
- `app/api/v1/auth/signup/route.ts`
- `app/api/v1/auth/verify-email/route.ts`
- `app/api/v1/auth/phone/send-otp/route.ts`
- `app/api/v1/auth/verify-phone/route.ts`
- `app/api/v1/auth/login/route.ts`
- `app/api/v1/auth/logout/route.ts`
- `app/api/v1/auth/resend-email-otp/route.ts`
- `app/api/v1/auth/resend-phone-otp/route.ts`
- `app/api/v1/auth/me/route.ts`
- `app/api/v1/users/[id]/route.ts`
- `app/api/v1/users/me/route.ts`
- `app/api/v1/listings/route.ts`
- `app/api/v1/listings/[id]/route.ts`
- `server/lib/withRoute.ts`
- `server/lib/authenticate.ts`
- `server/lib/parseRequest.ts`

## 10. Bottom Line

The backend integration is straightforward in architecture but not trivial in execution.

What is easy:

- preserving Supabase
- preserving services and repositories
- preserving the API contract
- preserving frontend functionality

What actually changes:

- the transport layer
- request/auth/error middleware shape
- env defaults
- production rate limiting strategy
- deployment/runtime assumptions

What should remain stable:

- business logic
- data model
- auth flow behavior
- listing CRUD behavior
- frontend page behavior

## 11. Recommended Non-Negotiables During Implementation

- do not modify the UI in any way
- do not modify feature behavior in any way
- do not rewrite service logic unless forced
- do not change API payload shapes casually
- do not expose service-role secrets to client code
- do not keep in-memory rate limiting for production Vercel deployment
- do not merge frontend and backend by proxying to the old Express server long-term; port the routes properly

If those constraints are respected, BoilerSub can be integrated into one complete project and deployed cleanly to Vercel with the same functional behavior it has today.

# ONE.md — BoilerSub Integrated Architecture Migration & Vercel Deployment Plan

> **Goal**: Collapse the existing split Express backend (`/src`) + Next.js frontend (`/boilersub-frontend`) into a **single integrated Next.js 14 (App Router) project at the repo root**, deploy it live to **Vercel** on the custom domain **BoilerSub.com**, while preserving 100% of existing repository, service, and Supabase logic. The same `/api/v1/*` contract continues to serve the web app today and a future React Native / Expo mobile app tomorrow.

---

## Phase 0 — Preconditions & Prep (do this BEFORE touching code)

### 0.1 Account & resource checklist
- [ ] Vercel account created and connected to the GitHub org/user that will host the repo.
- [ ] BoilerSub.com domain ownership confirmed in your registrar (Namecheap / GoDaddy / etc.).
- [ ] Supabase project provisioned (Free or Pro), with `Project URL`, `anon key`, and `service_role key` copied to a secure password manager.
- [ ] Twilio account (or Supabase-managed SMS) configured for phone OTP.
- [ ] GitHub repo exists for BoilerSub (private recommended).

### 0.2 Critical Supabase dashboard fixes (BLOCKER for auth flow)
These must be done **first** because the current production behavior sends magic links instead of OTPs.

1. **Authentication → Email Templates → "Confirm signup"**
   - Replace any `{{ .ConfirmationURL }}` reference with `{{ .Token }}`.
   - Body should read e.g. *"Your BoilerSub verification code is: `{{ .Token }}`"*.
2. **Authentication → Email Templates → "Magic Link"** — disable or also convert to `{{ .Token }}` to be safe.
3. **Authentication → Providers → Phone** — enable, attach Twilio credentials (Account SID, Auth Token, Message Service SID).
4. **Authentication → URL Configuration**
   - Site URL → `https://boilersub.com`
   - Redirect URLs → add `https://boilersub.com/**` and `http://localhost:3000/**`.
5. **Authentication → Email Auth** → ensure "Confirm email" is **ON**.
6. **Authentication → Rate Limits** → confirm OTP limits match `PLAN2.md` §11.

### 0.3 Local snapshot
- [ ] `git status` clean on the existing `BoilerSub/` workdir; commit current state to a `pre-integration` branch so you can roll back.
- [ ] Tag it: `git tag pre-integration && git push --tags`.

---

## Phase 1 — New Repository Skeleton (single Next.js app at root)

### 1.1 Reorganize directories
The end state must look like this. Treat **the repo root itself** as the Next.js project (no nested `boilersub-frontend/`).

```
boilersub/                                  ← repo root = Next.js app
├── app/                                    (moved from boilersub-frontend/src/app)
│   ├── layout.tsx
│   ├── page.tsx
│   ├── signup/page.tsx
│   ├── login/page.tsx
│   ├── verify-email/page.tsx
│   ├── verify-phone/...
│   ├── listings/...
│   ├── profile/...
│   ├── users/[id]/page.tsx
│   ├── not-found.tsx
│   └── api/
│       └── v1/
│           ├── auth/
│           │   ├── signup/route.ts
│           │   ├── verify-email/route.ts
│           │   ├── phone/send-otp/route.ts
│           │   ├── verify-phone/route.ts
│           │   ├── login/route.ts
│           │   ├── logout/route.ts
│           │   ├── resend-email-otp/route.ts
│           │   ├── resend-phone-otp/route.ts
│           │   └── me/route.ts
│           ├── users/
│           │   ├── [id]/route.ts
│           │   └── me/route.ts
│           ├── listings/
│           │   ├── route.ts                ← GET (list) + POST (create)
│           │   └── [id]/route.ts           ← GET, PATCH, DELETE
│           └── health/route.ts
├── server/                                 ← MOVED from /src (rename to avoid Next conflict)
│   ├── config/
│   │   ├── env.ts
│   │   └── supabase.ts
│   ├── controllers/
│   ├── services/
│   ├── repositories/
│   ├── schemas/
│   ├── lib/
│   │   ├── apiError.ts
│   │   ├── envelope.ts
│   │   ├── logger.ts
│   │   ├── jobQueue.ts
│   │   ├── rateLimiter.ts
│   │   ├── fetchWithRetry.ts
│   │   └── withRoute.ts                    ← NEW: shared Route Handler wrapper
│   └── types/
├── src/                                    (moved from boilersub-frontend/src, EXCLUDING app/)
│   ├── components/
│   ├── context/
│   ├── hooks/
│   └── lib/
│       ├── apiClient.ts
│       ├── validators.ts
│       └── types.ts
├── public/
├── scripts/
│   └── seed.ts
├── migrations/
│   ├── 001_users.sql
│   ├── 002_listings.sql
│   ├── 003_indexes.sql
│   └── 004_rls_policies.sql
├── .env.local                              (gitignored)
├── .env.example
├── next.config.mjs
├── tailwind.config.ts
├── postcss.config.mjs
├── tsconfig.json
├── package.json
├── vercel.json
└── README.md
```

### 1.2 Concrete moves (run in order)
```bash
cd /Users/archeet/Desktop/BoilerSub

# 1. Save the old Express backend layers under /server (rename /src to avoid clashing with frontend src)
git mv src server

# 2. Lift the Next.js frontend up to the repo root
git mv boilersub-frontend/app .                || true   # if it exists at top-level
git mv boilersub-frontend/src ./src
git mv boilersub-frontend/public ./public      || true
git mv boilersub-frontend/next.config.mjs .
git mv boilersub-frontend/tailwind.config.ts .
git mv boilersub-frontend/postcss.config.mjs .
git mv boilersub-frontend/tsconfig.json ./tsconfig.json    # frontend tsconfig wins
git mv boilersub-frontend/next-env.d.ts .

# 3. Move pages from src/app → app at the root (Next 14 supports either, but App Router root is cleanest)
git mv src/app app

# 4. Delete the now-empty frontend folder and the Express entry file
rm -rf boilersub-frontend
rm server/index.ts
rm -rf server/routes        # routes are replaced by Next Route Handlers
rm -rf server/middleware    # middleware is replaced by withRoute() wrapper (see Phase 3)
```

### 1.3 Merge package.json files into a single root manifest
Replace the root `package.json` entirely with this consolidated version (combines backend deps, frontend deps, removes Express ecosystem):

```json
{
  "name": "boilersub",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "seed": "tsx scripts/seed.ts"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.55.0",
    "@supabase/ssr": "^0.5.2",
    "next": "14.2.35",
    "react": "^18",
    "react-dom": "^18",
    "zod": "^3.24.2"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "autoprefixer": "^10",
    "eslint": "^8",
    "eslint-config-next": "14.2.35",
    "postcss": "^8",
    "tailwindcss": "^3.4.1",
    "tsx": "^4.19.2",
    "typescript": "^5"
  }
}
```

**Removed (no longer needed)**: `express`, `cors`, `helmet`, `dotenv`, `@types/cors`, `@types/express`, `@google/genai`, `@google/stitch-sdk`. Helmet/CORS responsibilities move to `next.config.mjs` headers + Route Handler responses.

Then:
```bash
rm -rf node_modules package-lock.json
npm install
```

### 1.4 Patch tsconfig.json
Make sure path aliases cover both layers. Append/replace the `"paths"` block:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/app/*": ["./app/*"],
      "@/server/*": ["./server/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

### 1.5 next.config.mjs (security headers replace Helmet)
```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};
export default nextConfig;
```

---

## Phase 2 — Environment Variables (single source of truth)

### 2.1 Create `.env.local` at the repo root (gitignored)
```bash
# Public (safe to expose in browser bundle)
NEXT_PUBLIC_SUPABASE_URL=https://<your-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_API_BASE_URL=/api/v1

# Server only — NEVER prefixed with NEXT_PUBLIC_
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
LOG_LEVEL=info
NODE_ENV=development
```

### 2.2 Create `.env.example` (committed) with the same keys but blank values.

### 2.3 Update `server/config/env.ts` to read from `process.env` directly (no `dotenv` import — Next loads `.env.local` automatically):

```ts
function required(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

export const env = {
  SUPABASE_URL: required("NEXT_PUBLIC_SUPABASE_URL"),
  SUPABASE_ANON_KEY: required("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  SUPABASE_SERVICE_ROLE_KEY: required("SUPABASE_SERVICE_ROLE_KEY"),
  NODE_ENV: process.env.NODE_ENV ?? "development",
  LOG_LEVEL: process.env.LOG_LEVEL ?? "info",
};
```

### 2.4 Mirror these into Vercel later (Phase 7). The `NEXT_PUBLIC_API_BASE_URL` becomes `/api/v1` (relative) so the frontend always hits the same origin — no CORS, no env switching between dev/prod.

---

## Phase 3 — The `withRoute()` Wrapper (replaces Express middleware stack)

Create **`server/lib/withRoute.ts`** — this is the heart of the migration. It composes auth, validation, rate limiting, error handling, and the JSON envelope into a single helper that every Route Handler uses, so the existing services/repositories never have to know they're now running under Next.

```ts
import { NextRequest, NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";
import { ApiError } from "./apiError";
import { logger } from "./logger";
import { RateLimiter } from "./rateLimiter";
import { createServerClient } from "@/server/config/supabase";
import { SupabaseUserRepository } from "@/server/repositories/supabase.user.repository";
import type { User } from "@/server/types";

const limiter = new RateLimiter();

type Context<TBody> = {
  req: NextRequest;
  body: TBody;
  user: User | null;
  requestId: string;
};

type Options<TBody> = {
  schema?: ZodSchema<TBody>;
  requireAuth?: boolean;
  requireVerified?: boolean;
  rateLimit?: { key: (req: NextRequest, body: TBody) => string; max: number; windowMs: number; code: string };
};

export function withRoute<TBody = unknown>(
  opts: Options<TBody>,
  handler: (ctx: Context<TBody>) => Promise<unknown>,
) {
  return async (req: NextRequest, route?: { params: Record<string, string> }) => {
    const requestId = crypto.randomUUID();
    const log = logger.child({ requestId, path: req.nextUrl.pathname, method: req.method });
    try {
      const raw = req.method === "GET" || req.method === "DELETE"
        ? Object.fromEntries(req.nextUrl.searchParams)
        : await req.json().catch(() => ({}));

      const body = opts.schema ? opts.schema.parse(raw) : (raw as TBody);

      if (opts.rateLimit) {
        const ok = limiter.consume(
          `${opts.rateLimit.code}:${opts.rateLimit.key(req, body)}`,
          opts.rateLimit.max,
          opts.rateLimit.windowMs,
        );
        if (!ok) throw new ApiError(429, opts.rateLimit.code, "Rate limit exceeded");
      }

      let user: User | null = null;
      if (opts.requireAuth || opts.requireVerified) {
        const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!token) throw new ApiError(401, "unauthorized", "Missing access token");
        const supabase = createServerClient(token);
        const { data, error } = await supabase.auth.getUser();
        if (error || !data.user) throw new ApiError(401, "unauthorized", "Invalid session");
        const repo = new SupabaseUserRepository();
        user = await repo.findById(data.user.id);
        if (!user) throw new ApiError(401, "unauthorized", "User not found");
        if (opts.requireVerified && !user.fully_verified) {
          throw new ApiError(403, "not_verified", "Account is not fully verified");
        }
      }

      const result = await handler({ req, body, user, requestId });
      log.info("request_ok");
      return NextResponse.json({ success: true, data: result }, { headers: { "x-request-id": requestId } });
    } catch (err) {
      if (err instanceof ZodError) {
        return NextResponse.json(
          { success: false, error: { code: "validation_error", message: err.errors[0]?.message ?? "Invalid input", details: err.errors } },
          { status: 400, headers: { "x-request-id": requestId } },
        );
      }
      if (err instanceof ApiError) {
        log.warn("api_error", { code: err.code, status: err.statusCode });
        return NextResponse.json(
          { success: false, error: { code: err.code, message: err.message } },
          { status: err.statusCode, headers: { "x-request-id": requestId } },
        );
      }
      log.error("unhandled_error", { err: err instanceof Error ? err.message : String(err) });
      return NextResponse.json(
        { success: false, error: { code: "internal_error", message: "Something went wrong" } },
        { status: 500, headers: { "x-request-id": requestId } },
      );
    }
  };
}
```

> **Result**: Every existing controller/service file in `/server` works unchanged. Only the HTTP transport layer (Express → Next Route Handlers) changes.

---

## Phase 4 — Convert Each Route to a Next.js Route Handler

### 4.1 Auth routes — example: `app/api/v1/auth/signup/route.ts`
```ts
import { withRoute } from "@/server/lib/withRoute";
import { signupSchema } from "@/server/schemas/auth.schema";
import { AuthService } from "@/server/services/auth.service";
import { SupabaseUserRepository } from "@/server/repositories/supabase.user.repository";

const service = new AuthService(new SupabaseUserRepository());

export const POST = withRoute(
  {
    schema: signupSchema,
    rateLimit: { key: (req) => req.headers.get("x-forwarded-for") ?? "anon", max: 10, windowMs: 60 * 60 * 1000, code: "signup_rate_limited" },
  },
  ({ body }) => service.signup(body),
);
```

### 4.2 Repeat the pattern for every endpoint
| New file | Method(s) | Wrapper options |
|---|---|---|
| `app/api/v1/auth/signup/route.ts` | POST | rateLimit by IP |
| `app/api/v1/auth/verify-email/route.ts` | POST | rateLimit by email |
| `app/api/v1/auth/phone/send-otp/route.ts` | POST | requireAuth, rateLimit by phone |
| `app/api/v1/auth/verify-phone/route.ts` | POST | rateLimit by phone |
| `app/api/v1/auth/login/route.ts` | POST | rateLimit by IP |
| `app/api/v1/auth/logout/route.ts` | POST | requireAuth |
| `app/api/v1/auth/resend-email-otp/route.ts` | POST | rateLimit by email |
| `app/api/v1/auth/resend-phone-otp/route.ts` | POST | rateLimit by phone |
| `app/api/v1/auth/me/route.ts` | GET | requireAuth |
| `app/api/v1/users/[id]/route.ts` | GET | requireAuth |
| `app/api/v1/users/me/route.ts` | PATCH | requireAuth |
| `app/api/v1/listings/route.ts` | GET, POST | POST → requireVerified |
| `app/api/v1/listings/[id]/route.ts` | GET, PATCH, DELETE | PATCH/DELETE → requireVerified + ownership check inside service |
| `app/api/v1/health/route.ts` | GET | none |

### 4.3 Dynamic params
For `[id]` routes, extract from the second arg:
```ts
export const GET = async (req: NextRequest, { params }: { params: { id: string } }) =>
  withRoute({ requireAuth: true }, async ({ user }) => service.getById(params.id, user!.id))(req);
```

### 4.4 Force the Node runtime (Supabase service key needs Node, not Edge)
At the top of every Route Handler that uses `SUPABASE_SERVICE_ROLE_KEY`:
```ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
```

---

## Phase 5 — Frontend Wiring Updates

### 5.1 Patch `src/lib/apiClient.ts`
Change exactly one line so the client uses a relative URL (works in dev, prod, and mobile when pointed at the absolute domain):
```ts
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";
```

### 5.2 Auth token storage (unchanged for web, mobile uses SecureStore)
- Web: continues to read/write `localStorage` keys `bs_access_token` and `bs_user`.
- Mobile (future): swap `getToken()` for `expo-secure-store`'s `getItemAsync`. The rest of `apiClient.ts` is identical because the contract is the same `/api/v1/*` envelope.

### 5.3 AuthProvider — no changes needed if it already reads/writes through `apiClient`. Verify it does, otherwise refactor it to do so.

### 5.4 Protected route guards — unchanged; they redirect to `/login` based on `useAuth()` state.

---

## Phase 6 — Database Migrations (Supabase)

Run these via the Supabase Dashboard SQL Editor in order. Files live in `migrations/`.

### 6.1 `001_users.sql`
```sql
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  phone text unique,
  full_name text,
  bio text,
  email_verified boolean default false,
  phone_verified boolean default false,
  fully_verified boolean default false,
  role text default 'user',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 6.2 `002_listings.sql`
```sql
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  price numeric(10,2) not null,
  start_date date not null,
  end_date date not null,
  bedrooms int,
  bathrooms numeric(3,1),
  address text,
  amenities jsonb default '[]'::jsonb,
  model_url text,                      -- ← NEW: signed URL/path to .glb in Storage
  thumbnail_url text,                  -- ← NEW: 2D preview
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 6.3 `003_indexes.sql`
```sql
create index if not exists idx_listings_owner    on public.listings(owner_id);
create index if not exists idx_listings_dates    on public.listings(start_date, end_date);
create index if not exists idx_listings_price    on public.listings(price);
create index if not exists idx_listings_amen_gin on public.listings using gin (amenities);
```

### 6.4 `004_rls_policies.sql`
```sql
alter table public.users    enable row level security;
alter table public.listings enable row level security;

create policy "users_select_authenticated" on public.users
  for select using (auth.role() = 'authenticated');
create policy "users_update_self" on public.users
  for update using (auth.uid() = id);

create policy "listings_select_authenticated" on public.listings
  for select using (auth.role() = 'authenticated');
create policy "listings_insert_owner" on public.listings
  for insert with check (auth.uid() = owner_id);
create policy "listings_update_owner" on public.listings
  for update using (auth.uid() = owner_id);
create policy "listings_delete_owner" on public.listings
  for delete using (auth.uid() = owner_id);
```

### 6.5 Supabase Storage buckets (for 3D models — Phase 9 expansion-ready)
1. Storage → New bucket → `listing-models` (Private).
2. Storage → New bucket → `listing-thumbnails` (Public).
3. Add bucket policies allowing `auth.uid() = owner` to insert/update.

### 6.6 Run the seed
```bash
npm run seed
```

---

## Phase 7 — Vercel Project Setup

### 7.1 Push to GitHub
```bash
git add .
git commit -m "feat: collapse to integrated Next.js architecture for Vercel deploy"
git push origin main
```

### 7.2 Import the project into Vercel
1. Vercel Dashboard → **Add New… → Project**.
2. Select the GitHub repo.
3. **Framework Preset**: Next.js (auto-detected).
4. **Root Directory**: `.` (repo root — confirm).
5. **Build Command**: `next build` (default).
6. **Output Directory**: `.next` (default).
7. **Install Command**: `npm install` (default).

### 7.3 Add environment variables (Vercel → Project → Settings → Environment Variables)
For **all three environments** (Production, Preview, Development):

| Key | Value | Type |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project>.supabase.co` | Plain |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `<anon-key>` | Plain |
| `SUPABASE_SERVICE_ROLE_KEY` | `<service-role-key>` | **Sensitive** |
| `NEXT_PUBLIC_API_BASE_URL` | `/api/v1` | Plain |
| `LOG_LEVEL` | `info` | Plain |
| `NODE_ENV` | (Vercel sets this automatically) | — |

> **Critical**: Mark `SUPABASE_SERVICE_ROLE_KEY` as **Sensitive** so it never appears in build logs.

### 7.4 First deploy
- Click **Deploy**.
- Watch the build logs; expect 2–4 minutes.
- Vercel will give you a `*.vercel.app` URL. Visit `/api/v1/health` to confirm the API responds.

### 7.5 `vercel.json` (optional, only if you need overrides)
```json
{
  "functions": {
    "app/api/v1/**/route.ts": {
      "maxDuration": 30,
      "memory": 1024
    }
  }
}
```

---

## Phase 8 — Custom Domain: BoilerSub.com

### 8.1 Add the domain in Vercel
1. Project → **Settings → Domains**.
2. Type `boilersub.com` → **Add**.
3. Vercel will also auto-add `www.boilersub.com` and recommend redirecting one to the other. **Pick `https://boilersub.com` as the primary** (apex). Redirect `www → apex`.

### 8.2 DNS records at your registrar
Vercel will display the exact records — they typically are:

| Type | Host | Value | TTL |
|---|---|---|---|
| `A` | `@` | `76.76.21.21` | Auto |
| `CNAME` | `www` | `cname.vercel-dns.com` | Auto |

Apply these in your registrar's DNS panel. Propagation: 1–60 min.

### 8.3 SSL
Vercel auto-provisions a Let's Encrypt cert once DNS propagates. No action needed.

### 8.4 Update Supabase URL Configuration (already done in Phase 0.2 step 4 — verify)
- Site URL must be `https://boilersub.com`.
- Add `https://boilersub.com/**` to redirect URLs.

---

## Phase 9 — Post-deploy Smoke Test (DO ALL OF THESE)

### 9.1 API contract
```bash
curl https://boilersub.com/api/v1/health
# → {"success":true,"data":{"status":"ok"}}
```

### 9.2 End-to-end auth walkthrough (incognito browser)
1. Visit `https://boilersub.com` → landing page renders.
2. Sign Up with `you@purdue.edu` → check inbox for **6-digit OTP** (NOT a link).
3. Enter OTP on `/verify-email` → routed to `/verify-phone`.
4. Enter `+1XXXXXXXXXX` → SMS arrives with 6-digit code.
5. Enter SMS code → routed to `/listings`.
6. Browse seeded listings.
7. Create a new listing → it appears in `/profile/listings`.
8. Edit and delete the listing → confirmed gone.
9. Log out → routed to `/login`.
10. Log back in → session restored.

### 9.3 Watch logs
- Vercel Dashboard → **Project → Logs** → filter by `error` level.
- Supabase Dashboard → **Logs Explorer** → confirm `auth.users` row counts match seed + manual signups.

---

## Phase 10 — Mobile-app Readiness Checklist (do NOT build the app yet — just confirm the API is mobile-ready)

- [x] All routes prefixed with `/api/v1` (versioned).
- [x] All responses use `{ success, data | error }` envelope.
- [x] Auth uses Supabase JWT in `Authorization: Bearer <token>` header (works identically from React Native).
- [x] No CORS restrictions blocking mobile (Next handlers respond to any origin by default; lock down if needed via middleware).
- [x] Phone format `^\+1\d{10}$` enforced server-side, not client-side.
- [x] No cookies, no session middleware — pure JWT (mobile-friendly).

When you build the Expo app, install:
```bash
npx create-expo-app boilersub-mobile
cd boilersub-mobile
npx expo install expo-secure-store
```
Then copy `src/lib/apiClient.ts` over and swap `localStorage` for `SecureStore`. Done.

---

## Phase 11 — 3D Model Expansion (when you're ready, post-launch)

Already wired in `002_listings.sql` via `model_url` and `thumbnail_url`. Pattern:

1. Frontend: user uploads `.glb` → request a signed upload URL from `POST /api/v1/listings/:id/upload-url` (new Route Handler, ~30 lines).
2. Browser uploads directly to Supabase Storage (`listing-models` bucket) using the signed URL. **Bypasses Vercel's 4.5MB function limit entirely.**
3. Server saves the resulting `model_url` on the `listings` row.
4. Frontend loads the model with `<model-viewer>` or `react-three-fiber` from the signed download URL.

> Always have files travel **browser ⇄ Supabase Storage directly**. Never proxy them through Vercel functions.

---

## Phase 12 — Operational Runbook

### 12.1 Daily/weekly ops
- Vercel auto-deploys on every push to `main`.
- Pull requests get preview URLs automatically.
- Rollback: Vercel → Deployments → click old deploy → **Promote to Production**.

### 12.2 Monitoring
- Vercel Analytics (free tier): enable Web Vitals.
- Supabase Dashboard: monitor DB CPU, connection count.
- Set Vercel **Spend Management** cap to avoid surprise bills (~$20 hobby cap is plenty for 1500 users).

### 12.3 Capacity sanity check (1500 users)
- Vercel Hobby plan: 100 GB-hours of function time, 100 GB bandwidth/month → **comfortably covers 1500 users** at typical usage.
- Supabase Free: 500 MB DB, 1 GB storage, 2 GB bandwidth → adequate for text + thumbnails. Move to Pro ($25/mo) if you cross 500 MB or want backups.

---

## Phase 13 — Rollback Plan

If something breaks in production:
1. Vercel → Deployments → previous green deploy → **Promote to Production** (instant).
2. If DB schema is the problem: revert via the SQL editor using the `migrations/` files as the authoritative source.
3. If both backend and DB are broken: `git checkout pre-integration` → push to a hotfix branch → redeploy.

---

## Final Pre-flight Checklist (tick every box before you call it done)

- [ ] Phase 0.2 Supabase email template uses `{{ .Token }}`, NOT `{{ .ConfirmationURL }}`.
- [ ] Repo root is the Next.js app; no nested `boilersub-frontend/`; old Express `index.ts` and `routes/` deleted.
- [ ] Single root `package.json` with no Express, helmet, cors, or dotenv.
- [ ] `withRoute()` wrapper exists at `server/lib/withRoute.ts` and every Route Handler uses it.
- [ ] `runtime = "nodejs"` set on every API route that touches `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] `apiClient.ts` BASE_URL defaults to relative `/api/v1`.
- [ ] All four migrations + RLS policies applied on the live Supabase project.
- [ ] Seed script runs cleanly against live Supabase.
- [ ] All env vars set in Vercel (Production + Preview + Development).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` flagged as **Sensitive** in Vercel.
- [ ] DNS A record for `boilersub.com` → `76.76.21.21` propagated.
- [ ] DNS CNAME for `www.boilersub.com` → `cname.vercel-dns.com` propagated.
- [ ] Supabase Site URL = `https://boilersub.com`.
- [ ] `https://boilersub.com/api/v1/health` returns `{success:true,data:{status:"ok"}}`.
- [ ] Full signup → email OTP → phone OTP → login → CRUD listing flow passes in production.
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` strings appear in any browser-bundled file (verify via `grep` on `.next/static/`).

---

## Architecture Summary (one paragraph for future-you)

BoilerSub now runs as a **single Next.js 14 App Router project** deployed to Vercel at `https://boilersub.com`. The repo root holds both the React frontend (under `app/` and `src/`) and the backend transport layer (under `app/api/v1/.../route.ts`). Every Route Handler is a thin wrapper around the existing controller → service → repository → Supabase pipeline preserved verbatim under `/server`. A shared `withRoute()` helper composes auth, validation (Zod), rate limiting, and the `{success, data|error}` envelope so handlers stay one-liners. The Supabase project is the single source of truth for auth (email + phone OTP) and Postgres data, with RLS enforcing row-level security at the DB layer. The same `/api/v1/*` contract serves the web app today and a future Expo mobile app tomorrow with zero duplication. 3D models live in Supabase Storage and never travel through Vercel functions, sidestepping the 4.5MB serverless body limit. Total infra cost at 1500 users: **~$0–25/month**.

# BoilerSub — Integration Guide (INTEGRATION.md)                                                                                                                                                        
                                                                                                                                                                                                        
  End-to-end runbook to stand up BoilerSub — the Purdue-only sublease marketplace — from a fresh clone to a demoable full-stack app sharable over ngrok. This document assumes the backend at             
  `/Users/archeet/Desktop/BoilerSub` (already implemented per `PLAN2.md` and verified by `graphify-out/graph.json`) and a brand-new Next.js frontend scaffolded to match `FRONT.md`, using the stitch HTML
   mockups in `stitch_purdue_sublease_connect/` as visual reference.                                                                                                                                      
                                                   
  ---                                                                                                                                                                                                     
   
  ## 0. TL;DR (5-minute path)                                                                                                                                                                             
                                                   
  ```bash                                                                                                                                                                                                 
  # 1. Backend                                     
  cd /Users/archeet/Desktop/BoilerSub          
  cp .env.example .env          # then paste the values from §5 below
  npm install                                                                                                                                                                                             
  npm run seed                  # only if not already seeded
  npm run dev                   # http://localhost:4000                                                                                                                                                   
                                                                                                                                                                                                          
  # 2. Frontend (fresh scaffold in a sibling folder)                                                                                                                                                      
  cd /Users/archeet/Desktop/BoilerSub                                                                                                                                                                     
  npx create-next-app@14 boilersub-frontend --ts --tailwind --app --src-dir --eslint --import-alias "@/*"                                                                                                 
  cd boilersub-frontend                                                                                                                                                                                   
  npm install                                                                                                                                                                                             
  cp .env.local.example .env.local    # set NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1                                                                                                         
  npm run dev                         # http://localhost:3000                                                                                                                                             
                                                                                                                                                                                                          
  # 3. Share                                                                                                                                                                                              
  ngrok http 3000                     # public URL for the frontend                                                                                                                                       
  ngrok http 4000                     # public URL for the backend, put into NEXT_PUBLIC_API_BASE_URL + CORS_ORIGIN                                                                                       
                                                                                                                                                                                                          
  Everything below is the long-form version of those 3 steps.                                                                                                                                             
                                                                                                                                                                                                          
  ---                                                                                                                                                                                                     
  1. Architecture Overview                         
                                                                                                                                                                                                          
  ┌────────────────────────┐          ┌──────────────────────────┐          ┌───────────────────────┐
  │  Next.js 14 Frontend   │  HTTPS   │  Express Backend         │  REST    │  Supabase             │                                                                                                     
  │  (App Router, TS, TW)  ├────────►│  /api/v1/* (port 4000)   ├────────►│  Postgres + Auth + RLS │                                                                                                      
  │  port 3000             │ Bearer   │  Layered: routes →       │          │  Email OTP + SMS OTP  │                                                                                                     
  │  apiClient.ts          │ JWT      │  controllers → services  │          │                       │                                                                                                     
  │  AuthProvider (Ctx)    │          │  → repositories          │          │                       │                                                                                                     
  └────────────────────────┘          └──────────────────────────┘          └───────────────────────┘                                                                                                     
                                                                                                                                                                                                          
  - Single source of truth for domain logic: the Express backend.                                                                                                                                         
  - Frontend never talks to Supabase directly — it always goes through /api/v1/.... This is why we skip @supabase/ssr on the frontend side; all Supabase access is brokered by the backend's service-role 
  / anon clients.                                                                                                                                                                                         
  - Stable envelope on every response: { success: boolean, data?: T, error?: { code, message } }.
  - Token: Supabase access_token returned by the backend on successful verification/login, stored in browser localStorage, injected as Authorization: Bearer <token> by apiClient.ts.                     
  - Frontend origin: http://localhost:3000. Backend CORS_ORIGIN must match exactly.                                                                                                                       
  - Demo mode: phone verification is stubbed — a small backend patch auto-marks users fully_verified on email OTP success so the entire auth flow completes without Twilio.                               
                                                                                                                                                                                                          
  ---                                                                                                                                                                                                     
  2. Prerequisites                                                                                                                                                                                        
                                                                                                                                                                                                          
  - Node.js ≥ 20 (both projects)               
  - npm ≥ 10                                                                                                                                                                                              
  - A Supabase project already provisioned at ifzyddzpotkufndkwgyv.supabase.co with:
    - users, listings tables (migrations already pushed ✓)                                                                                                                                                
    - scripts/seed.ts already run in the dashboard (✓ per user confirmation)                                                                                                                              
    - Email confirmation currently set to "confirmation URL" — you will switch this to OTP mode in §4                                                                                                     
  - ngrok (optional — only if sharing) — brew install ngrok then ngrok config add-authtoken <your-token>                                                                                                  
  - Ports free: 3000 (frontend), 4000 (backend)                                                                                                                                                           
                                                                                                                                                                                                          
  ---                                                                                                                                                                                                     
  3. Repository Layout (after setup)                                                                                                                                                                      
                                                                                                                                                                                                          
  /Users/archeet/Desktop/BoilerSub/            
  ├── src/                        # EXISTING backend                                                                                                                                                      
  │   ├── index.ts                                                                                                                                                                                        
  │   ├── config/{supabase.ts, env.ts}         
  │   ├── middleware/{requireAuth, requireVerified, rateLimit, validate, errorHandler, requestId, logger, requirePermission, asyncHandler}.ts                                                             
  │   ├── routes/{auth, users, listings}.routes.ts                                                                                                                                                        
  │   ├── controllers/{auth, users, listings}.controller.ts                                                                                                                                               
  │   ├── services/{auth, users, listings}.service.ts                                                                                                                                                     
  │   ├── repositories/{user.repository.ts, listing.repository.ts, supabase.user.repository.ts, supabase.listing.repository.ts}
  │   ├── lib/{apiError, logger, rateLimiter, jobQueue, envelope, http, fetchWithRetry}.ts                                                                                                                
  │   ├── schemas/{auth, users, listings}.schema.ts                                                                                                                                                       
  │   └── types/{index.ts, express.d.ts}                                                                                                                                                                  
  ├── scripts/seed.ts                                                                                                                                                                                     
  ├── migrations/{001_users.sql, 002_listings.sql, 003_indexes.sql, 004_rls_policies.sql}                                                                                                                 
  ├── stitch_purdue_sublease_connect/      # design mockups (code.html + screen.png per page)                                                                                                             
  │   ├── boilersub_create_account/                                                                                                                                                                       
  │   ├── boilersub_login/                                                                                                                                                                                
  │   ├── boilersub_email_verification/                                                                                                                                                                   
  │   ├── boilersub_phone_verification/            
  │   ├── boilersub_phone_verification_code/                                                                                                                                                              
  │   ├── boilersub_listings_with_map_discovery/
  │   ├── boilersub_listing_details/                                                                                                                                                                      
  │   ├── list_your_sublease/                                                                                                                                                                             
  │   ├── boilersub_edit_listing/              
  │   ├── boilersub_my_profile/                                                                                                                                                                           
  │   ├── boilersub_my_listings_dashboard/         
  │   ├── boilersub_public_profile/                                                                                                                                                                       
  │   ├── boilersub_404_page/
  │   ├── boilersub_hero_v3_kinetic_update/                                                                                                                                                               
  │   └── boilerpulse_high_energy/                                                                                                                                                                        
  ├── graphify-out/{graph.json, graph.html, GRAPH_REPORT.md}
  ├── PLAN2.md                    # Backend PRD                                                                                                                                                           
  ├── FRONT.md                    # Frontend PRD                                                                                                                                                          
  ├── INTEGRATION.md              # THIS FILE                                                                                                                                                             
  ├── package.json                # backend                                                                                                                                                               
  └── boilersub-frontend/         # NEW — scaffolded in §7                                                                                                                                                
      ├── app/                                                                                                                                                                                            
      ├── src/                                                                                                                                                                                            
      ├── package.json                                                                                                                                                                                    
      └── .env.local                               
                                                                                                                                                                                                          
  ---
  4. Supabase Dashboard Setup (one-time)                                                                                                                                                                  
                                                   
  Open the dashboard at https://supabase.com/dashboard/project/ifzyddzpotkufndkwgyv.
                                                                                                                                                                                                          
  4.1 Switch email confirmation to OTP mode
                                                                                                                                                                                                          
  Backend code (src/services/auth.service.ts) calls supabase.auth.verifyOtp({ email, token, type: "email" }) — this requires the email template to send a 6-digit OTP, not a magic link.                  
                                               
  1. Go to Authentication → Email Templates → "Confirm signup".                                                                                                                                           
  2. Replace {{ .ConfirmationURL }} in the template body with {{ .Token }}.
  3. Rewrite the copy to say:                                                                                                                                                                             
  Welcome to BoilerSub! Your 6-digit verification code is:
                                                                                                                                                                                                          
  {{ .Token }}                                     
                                                                                                                                                                                                          
  This code expires in 60 minutes.                                                                                                                                                                        
  4. Save.                                     
  5. Confirm Authentication → Providers → Email has "Enable email confirmations" ON.                                                                                                                      
                                                                                                                                                                                                          
  4.2 Phone provider — leave disabled (demo mode)                                                                                                                                                         
                                                                                                                                                                                                          
  Do not configure Twilio. Phone verification is skipped in this integration via a backend demo flag (§6.2).                                                                                              
                                                   
  4.3 Site URL & Redirects (optional — doesn't matter for OTP flow)                                                                                                                                       
                                                   
  - Site URL: http://localhost:3000                                                                                                                                                                       
  - Redirect URLs: http://localhost:3000/**        
                                                                                                                                                                                                          
  These are only relevant if you ever switch to magic-link flow; OTP flow doesn't redirect.                                                                                                               
                                               
  4.4 Verify tables exist                                                                                                                                                                                 
                                                   
  Table Editor → check for users and listings. If seed ran successfully, users should have ~10 rows and listings ~30 rows.                                                                                
                                                   
  If seed was NOT run yet, run it from the backend folder after §6:                                                                                                                                       
                                                   
  cd /Users/archeet/Desktop/BoilerSub                                                                                                                                                                     
  npm run seed                                     
                                                                                                                                                                                                          
  4.5 RLS policies
                                                                                                                                                                                                          
  Database → Policies → ensure RLS is enabled on both users and listings, with policies per migrations/004_rls_policies.sql:                                                                              
                                               
  - users.select — any authenticated                                                                                                                                                                      
  - users.update — auth.uid() = id                 
  - listings.select — any authenticated                                                                                                                                                                   
  - listings.insert/update/delete — auth.uid() = owner_id
                                                                                                                                                                                                          
  ---
  5. Credentials (verified, copy-paste into backend .env)                                                                                                                                                 
                                                                                                                                                                                                          
  SUPABASE_URL=https://ifzyddzpotkufndkwgyv.supabase.co
  SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlkZHpwb3RrdWZuZGt3Z3l2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4OTQ5NzgsImV4cCI6MjA5MTQ3MDk3OH0.9b2qly4yT80fImTwO
  wkIa3gu3HYQHOPpQBz-ApxV3Q4                                                                                                                                                                              
  SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlmenlkZHpwb3RrdWZuZGt3Z3l2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTg5NDk3OCwiZXhwIjoyMDkxNDcwOTc4f
  Q.ELlpnKXRIBrDcyV41_R0i8FTX2Ri1POF8mYap2H_o4c                                                                                                                                                           
  PORT=4000                                        
  NODE_ENV=development                                                                                                                                                                                    
  CORS_ORIGIN=http://localhost:3000                                                                                                                                                                       
  LOG_LEVEL=info                               
  SKIP_PHONE_VERIFICATION=true                                                                                                                                                                            
                                                                                                                                                                                                          
  Never commit this file. .env is already in .gitignore.                                                                                                                                                  
                                                                                                                                                                                                          
  ▎ Service-role key is a trust-boundary secret. Keep it server-only — do not prefix it with NEXT_PUBLIC_ and never reference it in the frontend.                                                         
                                                   
  ---                                                                                                                                                                                                     
  6. Backend Setup                                 
                                                                                                                                                                                                          
  6.1 Install deps & baseline run
                                                                                                                                                                                                          
  cd /Users/archeet/Desktop/BoilerSub              
  npm install                                                                                                                                                                                             
  npm run dev
                                                                                                                                                                                                          
  Expected console output:                         
  {"level":"info","message":"server_started","port":4000,...}
                                                             
  Quick sanity check:                                                                                                                                                                                     
  curl http://localhost:4000/health                                                                                                                                                                       
  # → {"success":true,"data":{"status":"ok"}}                                                                                                                                                             
                                                                                                                                                                                                          
  6.2 Required patches (skip-phone demo mode)                                                                                                                                                             
                                               
  The existing backend blocks login and all listing writes on fully_verified=true, which only gets set after SMS OTP. For the demo we mark users fully verified immediately on email OTP success, gated by
   a SKIP_PHONE_VERIFICATION env flag so it's reversible.
                                                                                                                                                                                                          
  Patch 1 — src/config/env.ts                                                                                                                                                                             
                                               
  Add to the Zod schema (inside envSchema.object({...})):                                                                                                                                                 
  SKIP_PHONE_VERIFICATION: z                       
    .enum(["true", "false"])                                                                                                                                                                              
    .default("false")                                                                                                                                                                                     
    .transform((v) => v === "true"),           
                                                                                                                                                                                                          
  Patch 2 — src/services/auth.service.ts                                                                                                                                                                  
                                               
  Import the env at top:                                                                                                                                                                                  
  import { env } from "../config/env.js";          
                                                                                                                                                                                                          
  Replace the existing verifyEmail method body with:
  async verifyEmail(email: string, token: string): Promise<{ status: string }> {                                                                                                                          
    const { data, error } = await supabaseAnonClient.auth.verifyOtp({ email, token, type: "email" });
    if (error || !data.user) {                                                                                                                                                                            
      throw new ApiError(400, "email_verification_failed", error?.message ?? "Email verification failed");                                                                                                
    }                                                                                                                                                                                                     
                                                                                                                                                                                                          
    if (env.SKIP_PHONE_VERIFICATION) {                                                                                                                                                                    
      await this.userRepository.markFullyVerified(data.user.id);                                                                                                                                          
      return { status: "fully_verified" };                                                                                                                                                                
    }                                                                                                                                                                                                     
                                               
    await this.userRepository.markEmailVerified(data.user.id);                                                                                                                                            
    return { status: "pending_phone_verification" };                                                                                                                                                      
  }                                                 
                                                                                                                                                                                                          
  Patch 3 — src/services/auth.service.ts — return session on email verify (demo mode)
                                                                                                                                                                                                          
  In demo mode we need to return the session immediately so the frontend can proceed straight to /listings. Update verifyEmail to return AuthSessionPayload when SKIP_PHONE_VERIFICATION is true:         
                                                                                                                                                                                                          
  async verifyEmail(                                                                                                                                                                                      
    email: string,                                 
    token: string,                             
  ): Promise<{ status: string } | AuthSessionPayload> {
    const { data, error } = await supabaseAnonClient.auth.verifyOtp({ email, token, type: "email" });                                                                                                     
    if (error || !data.user) {
      throw new ApiError(400, "email_verification_failed", error?.message ?? "Email verification failed");                                                                                                
    }                                                                                                                                                                                                     
                                               
    if (env.SKIP_PHONE_VERIFICATION) {                                                                                                                                                                    
      const user = await this.userRepository.markFullyVerified(data.user.id);
      return {                                                                                                                                                                                            
        session: data.session
          ? {                                                                                                                                                                                             
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,                                                                                                                                                  
              expires_in: data.session.expires_in, 
              token_type: data.session.token_type,                                                                                                                                                        
            }
          : null,                                                                                                                                                                                         
        user,                                      
      };                                       
    }

    await this.userRepository.markEmailVerified(data.user.id);                                                                                                                                            
    return { status: "pending_phone_verification" };
  }                                                                                                                                                                                                       
                                                   
  Patch 4 — rebuild                            

  npm run build
  npm run dev                                                                                                                                                                                             
   
  To re-enable phone verification later, set SKIP_PHONE_VERIFICATION=false in .env and restart. No code changes required.                                                                                 
                                                   
  6.3 Smoke-test auth against the real backend                                                                                                                                                            
                                                   
  # 1. Signup                                                                                                                                                                                             
  curl -X POST http://localhost:4000/api/v1/auth/signup \
    -H "Content-Type: application/json" \                                                                                                                                                                 
    -d '{"email":"test@purdue.edu","password":"Password123!"}'
  # → {"success":true,"data":{"status":"pending_email_verification","userId":"..."}}                                                                                                                      
                                                                                                                                                                                                          
  # 2. Check inbox for the 6-digit code, then:                                                                                                                                                            
  curl -X POST http://localhost:4000/api/v1/auth/verify-email \                                                                                                                                           
    -H "Content-Type: application/json" \                                                                                                                                                                 
    -d '{"email":"test@purdue.edu","token":"123456"}'
  # → {"success":true,"data":{"session":{"access_token":"eyJ..."},"user":{"fully_verified":true,...}}}                                                                                                    
                                                                                                                                                                                                          
  # 3. Fetch listings with the access token                                                                                                                                                               
  curl http://localhost:4000/api/v1/listings?limit=20&offset=0 \                                                                                                                                          
    -H "Authorization: Bearer <access_token>"                                                                                                                                                             
  # → {"success":true,"data":[{...}, ...]}         
                                                                                                                                                                                                          
  If all three return success:true, backend is wired correctly. Move to frontend.                                                                                                                         
                                                                                                                                                                                                          
  ---                                                                                                                                                                                                     
  7. Frontend Scaffold                             
                                               
  7.1 Create the Next.js project

  cd /Users/archeet/Desktop/BoilerSub
  npx create-next-app@14 boilersub-frontend \                                                                                                                                                             
    --ts --tailwind --app --src-dir --eslint \
    --import-alias "@/*" --use-npm                                                                                                                                                                        
  cd boilersub-frontend                                                                                                                                                                                   
                                               
  Answer prompts:                                                                                                                                                                                         
  - Would you like to use Turbopack for next dev? → No (stable webpack)
  - Everything else → accept default.                                                                                                                                                                     
                                     
  7.2 Install runtime deps                                                                                                                                                                                
                                                                                                                                                                                                          
  npm install clsx                             
                                                                                                                                                                                                          
  No Supabase SDK needed — frontend talks only to the backend.                                                                                                                                            
                                               
  7.3 Environment                                                                                                                                                                                         
                                                   
  Create .env.local:                                                                                                                                                                                      
  NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
                                                       
  And .env.local.example (committable):
  NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1                                                                                                                                                   
                                                       
  7.4 Tailwind tokens from the stitch design                                                                                                                                                              
                                                                                                                                                                                                          
  The stitch mockups use Plus Jakarta Sans (headings) + Manrope (body), with Electric Blue #0052d0 for primary and Kinetic Coral #a03a0f for urgency. Edit tailwind.config.ts:                            
                                                                                                                                                                                                          
  import type { Config } from "tailwindcss";                                                                                                                                                              
                                                   
  const config: Config = {                     
    content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
    theme: {                                                                                                                                                                                              
      extend: {
        colors: {                                                                                                                                                                                         
          brand: {                                 
            blue: "#0052d0",                                                                                                                                                                              
            coral: "#a03a0f",
            bg: "#f9f6f5",                                                                                                                                                                                
          },                                                                                                                                                                                              
        },                                     
        fontFamily: {                                                                                                                                                                                     
          sans: ["Manrope", "system-ui", "sans-serif"],
          display: ["'Plus Jakarta Sans'", "system-ui", "sans-serif"],                                                                                                                                    
        },                                                                                                                                                                                                
      },                                                                                                                                                                                                  
    },                                                                                                                                                                                                    
    plugins: [],                                   
  };                                           

  export default config;

  Add the fonts in app/layout.tsx:                                                                                                                                                                        
  import "./globals.css";
  import { Manrope, Plus_Jakarta_Sans } from "next/font/google";                                                                                                                                          
  import { AuthProvider } from "@/context/AuthProvider";        
                                                                                                                                                                                                          
  const manrope = Manrope({ subsets: ["latin"], variable: "--font-sans" });                                                                                                                               
  const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-display" });                                                                                                                  
                                                                                                                                                                                                          
  export const metadata = { title: "BoilerSub", description: "Purdue-only subleasing" };                                                                                                                  
                                                                                                                                                                                                          
  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (                                                                                                                                                                                              
      <html lang="en" className={`${manrope.variable} ${jakarta.variable}`}>
        <body className="bg-brand-bg font-sans text-slate-900">             
          <AuthProvider>{children}</AuthProvider>                                                                                                                                                         
        </body>                                                                                                                                                                                           
      </html>                                                                                                                                                                                             
    );                                                                                                                                                                                                    
  }                                                
                                               
  7.5 Frontend file structure to create
                                                                                                                                                                                                          
  boilersub-frontend/
  ├── app/                                                                                                                                                                                                
  │   ├── layout.tsx                               
  │   ├── page.tsx                         # / (Landing)                                                                                                                                                  
  │   ├── signup/page.tsx
  │   ├── login/page.tsx                                                                                                                                                                                  
  │   ├── verify-email/page.tsx                    
  │   ├── verify-phone/                                                                                                                                                                                   
  │   │   ├── page.tsx                                                                                                                                                                                    
  │   │   └── code/page.tsx                    
  │   ├── listings/                                                                                                                                                                                       
  │   │   ├── page.tsx                     # Browse                                                                                                                                                       
  │   │   ├── new/page.tsx                     
  │   │   └── [id]/                                                                                                                                                                                       
  │   │       ├── page.tsx                                                                                                                                                                                
  │   │       └── edit/page.tsx                
  │   ├── profile/                                                                                                                                                                                        
  │   │   ├── page.tsx                             
  │   │   └── listings/page.tsx                
  │   ├── users/[id]/page.tsx                                                                                                                                                                             
  │   └── not-found.tsx
  ├── src/                                                                                                                                                                                                
  │   ├── lib/                                     
  │   │   ├── apiClient.ts                                                                                                                                                                                
  │   │   ├── validators.ts                        
  │   │   └── types.ts                         
  │   ├── context/AuthProvider.tsx                                                                                                                                                                        
  │   ├── hooks/{useAuth.ts, useListings.ts}
  │   └── components/                                                                                                                                                                                     
  │       ├── Button.tsx                           
  │       ├── Input.tsx                                                                                                                                                                                   
  │       ├── OtpInput.tsx                                                                                                                                                                                
  │       ├── ListingCard.tsx                  
  │       ├── AmenityChip.tsx                                                                                                                                                                             
  │       ├── Modal.tsx                            
  │       ├── Toast.tsx                                                                                                                                                                                   
  │       ├── VerificationBadge.tsx                                                                                                                                                                       
  │       ├── Nav.tsx                          
  │       └── ProtectedRoute.tsx                                                                                                                                                                          
  ├── .env.local                                   
  └── tailwind.config.ts                                                                                                                                                                                  
                                                   
  ---                                                                                                                                                                                                     
  8. apiClient.ts — the single contract bridge     
                                                                                                                                                                                                          
  Create src/lib/apiClient.ts:
                                                                                                                                                                                                          
  const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";
                                                                                                                                                                                                          
  export class ApiError extends Error {            
    constructor(public status: number, public code: string, message: string) {                                                                                                                            
      super(message);                              
    }                                          
  }                                                                                                                                                                                                       
   
  type Envelope<T> = { success: true; data: T } | { success: false; error: { code: string; message: string } };                                                                                           
                                                   
  function getToken(): string | null {                                                                                                                                                                    
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem("bs_access_token");
  }                                                                                                                                                                                                       
   
  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {                                                                                                                           
    const token = getToken();                      
    const res = await fetch(`${BASE_URL}${path}`, {                                                                                                                                                       
      ...init,                                     
      headers: {                               
        "Content-Type": "application/json",                                                                                                                                                               
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),                                                                                                                                                                          
      },                                                                                                                                                                                                  
    });                                        
                                                                                                                                                                                                          
    const body = (await res.json().catch(() => null)) as Envelope<T> | null;                                                                                                                              
                                               
    if (!res.ok || !body || body.success === false) {                                                                                                                                                     
      const code = body && "error" in body ? body.error.code : "network_error";
      const message = body && "error" in body ? body.error.message : res.statusText;                                                                                                                      
                                                                                                                                                                                                          
      if (res.status === 401 && typeof window !== "undefined") {                                                                                                                                          
        window.localStorage.removeItem("bs_access_token");                                                                                                                                                
        window.localStorage.removeItem("bs_user");                                                                                                                                                        
        window.location.href = "/login";       
      }                                                                                                                                                                                                   
      throw new ApiError(res.status, code, message);
    }                                                                                                                                                                                                     
                                                   
    return body.data;                          
  }

  // ---------- Auth ----------                                                                                                                                                                           
  export const auth = {
    signup: (email: string, password: string) =>                                                                                                                                                          
      request<{ status: string; userId: string | null }>("/auth/signup", {
        method: "POST",                                                                                                                                                                                   
        body: JSON.stringify({ email, password }),
      }),                                                                                                                                                                                                 
                                                   
    verifyEmail: (email: string, token: string) =>                                                                                                                                                        
      request<{ session: { access_token: string } | null; user: any } | { status: string }>(
        "/auth/verify-email",                                                                                                                                                                             
        { method: "POST", body: JSON.stringify({ email, token }) },
      ),                                                                                                                                                                                                  
                                                   
    sendPhoneOtp: (phone: string) =>                                                                                                                                                                      
      request<{ status: string }>("/auth/phone/send-otp", {
        method: "POST",                                                                                                                                                                                   
        body: JSON.stringify({ phone }),           
      }),                                                                                                                                                                                                 
                                                   
    verifyPhone: (phone: string, token: string) =>
      request<{ session: { access_token: string }; user: any }>("/auth/verify-phone", {
        method: "POST",                                                                                                                                                                                   
        body: JSON.stringify({ phone, token }),
      }),                                                                                                                                                                                                 
                                                   
    login: (email: string, password: string) =>                                                                                                                                                           
      request<{ session: { access_token: string }; user: any }>("/auth/login", {
        method: "POST",                        
        body: JSON.stringify({ email, password }),
      }),                                                                                                                                                                                                 
   
    logout: () => request<{ status: string }>("/auth/logout", { method: "POST" }),                                                                                                                        
                                                   
    me: () => request<{ user: any }>("/auth/me"),                                                                                                                                                         
   
    resendEmailOtp: (email: string) =>                                                                                                                                                                    
      request<{ status: string }>("/auth/resend-email-otp", {
        method: "POST",                                                                                                                                                                                   
        body: JSON.stringify({ email }),
      }),                                                                                                                                                                                                 
                                                   
    resendPhoneOtp: (phone: string) =>                                                                                                                                                                    
      request<{ status: string }>("/auth/resend-phone-otp", {
        method: "POST",                                                                                                                                                                                   
        body: JSON.stringify({ phone }),           
      }),                                      
  };                                                                                                                                                                                                      
   
  // ---------- Users ----------                                                                                                                                                                          
  export const users = {                           
    getById: (id: string) => request<any>(`/users/${id}`),
    updateMe: (patch: { full_name?: string; bio?: string }) =>
      request<any>("/users/me", { method: "PATCH", body: JSON.stringify(patch) }),                                                                                                                        
  };                                                                                                                                                                                                      
                                                                                                                                                                                                          
  // ---------- Listings ----------                                                                                                                                                                       
  export const listings = {                        
    list: (limit = 20, offset = 0) =>          
      request<any[]>(`/listings?limit=${limit}&offset=${offset}`),                                                                                                                                        
    getById: (id: string) => request<any>(`/listings/${id}`),
    create: (payload: any) =>                                                                                                                                                                             
      request<any>("/listings", { method: "POST", body: JSON.stringify(payload) }),
    update: (id: string, patch: any) =>                                                                                                                                                                   
      request<any>(`/listings/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),                                                                                                                  
    delete: (id: string) =>                    
      request<{ ok: true }>(`/listings/${id}`, { method: "DELETE" }),                                                                                                                                     
  };                                               
                                                                                                                                                                                                          
  export const apiClient = { auth, users, listings };                                                                                                                                                     
                                               
  ---                                                                                                                                                                                                     
  9. AuthProvider.tsx — session state via React Context
                                                                                                                                                                                                          
  Create src/context/AuthProvider.tsx:
                                                                                                                                                                                                          
  "use client";                                    
                                               
  import { createContext, useContext, useEffect, useState, useCallback } from "react";                                                                                                                    
  import { apiClient, ApiError } from "@/lib/apiClient";
                                                                                                                                                                                                          
  type User = {                                    
    id: string;                                                                                                                                                                                           
    email: string;                                 
    full_name: string | null;                  
    bio: string | null;
    email_verified: boolean;                                                                                                                                                                              
    phone_verified: boolean;
    fully_verified: boolean;                                                                                                                                                                              
    role: "user" | "admin";                        
  };                                                                                                                                                                                                      
   
  type AuthState = {                                                                                                                                                                                      
    user: User | null;                             
    status: "idle" | "loading" | "authenticated" | "unauthenticated";
    login: (email: string, password: string) => Promise<void>;                                                                                                                                            
    logout: () => Promise<void>;
    refresh: () => Promise<void>;                                                                                                                                                                         
    setSession: (accessToken: string, user: User) => void;
    isFullyVerified: boolean;                                                                                                                                                                             
  };
                                                                                                                                                                                                          
  const AuthContext = createContext<AuthState | null>(null);                                                                                                                                              
                                               
  export function AuthProvider({ children }: { children: React.ReactNode }) {                                                                                                                             
    const [user, setUser] = useState<User | null>(null);
    const [status, setStatus] = useState<AuthState["status"]>("loading");                                                                                                                                 
   
    const setSession = useCallback((token: string, u: User) => {                                                                                                                                          
      window.localStorage.setItem("bs_access_token", token);
      window.localStorage.setItem("bs_user", JSON.stringify(u));                                                                                                                                          
      setUser(u);                                                                                                                                                                                         
      setStatus("authenticated");              
    }, []);                                                                                                                                                                                               
                                                   
    const refresh = useCallback(async () => {  
      try {
        const data = await apiClient.auth.me();
        setUser(data.user);                                                                                                                                                                               
        window.localStorage.setItem("bs_user", JSON.stringify(data.user));
        setStatus("authenticated");                                                                                                                                                                       
      } catch (e) {                                
        setUser(null);                                                                                                                                                                                    
        setStatus("unauthenticated");
        window.localStorage.removeItem("bs_access_token");                                                                                                                                                
        window.localStorage.removeItem("bs_user"); 
      }                                                                                                                                                                                                   
    }, []);
                                                                                                                                                                                                          
    const login = useCallback(                     
      async (email: string, password: string) => {
        setStatus("loading");
        const data = await apiClient.auth.login(email, password);                                                                                                                                         
        if (!data.session) throw new ApiError(500, "no_session", "Login returned no session");
        setSession(data.session.access_token, data.user);                                                                                                                                                 
      },                                           
      [setSession],                                                                                                                                                                                       
    );                                             
                                               
    const logout = useCallback(async () => {                                                                                                                                                              
      try {
        await apiClient.auth.logout();                                                                                                                                                                    
      } catch {}                                   
      window.localStorage.removeItem("bs_access_token");
      window.localStorage.removeItem("bs_user");                                                                                                                                                          
      setUser(null);
      setStatus("unauthenticated");                                                                                                                                                                       
    }, []);                                        
                                               
    useEffect(() => {                                                                                                                                                                                     
      const cached = typeof window !== "undefined" ? window.localStorage.getItem("bs_user") : null;
      const token = typeof window !== "undefined" ? window.localStorage.getItem("bs_access_token") : null;                                                                                                
                                                   
      if (!token) {                                                                                                                                                                                       
        setStatus("unauthenticated");              
        return;                                                                                                                                                                                           
      }                                            
      if (cached) {                            
        try {
          setUser(JSON.parse(cached));
          setStatus("authenticated");                                                                                                                                                                     
        } catch {}
      }                                                                                                                                                                                                   
      refresh();                                   
    }, [refresh]);                             

    return (
      <AuthContext.Provider
        value={{                                                                                                                                                                                          
          user,
          status,                                                                                                                                                                                         
          login,                                   
          logout,                              
          refresh,
          setSession,
          isFullyVerified: !!user?.fully_verified,
        }}                                                                                                                                                                                                
      >
        {children}                                                                                                                                                                                        
      </AuthContext.Provider>                      
    );                                         
  }

  export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");                                                                                                                              
    return ctx;
  }                                                                                                                                                                                                       
                                                   
  ---                                          
  10. Pages — stitch HTML → Next.js mapping
                                                                                                                                                                                                          
  Each stitch folder has a code.html you can open in a browser to preview the visual target. Port the markup into the corresponding page, replacing anchor navigation with next/link and wiring buttons to
   apiClient.                                                                                                                                                                                             
                                                   
  ┌─────────────────────┬─────────────────────────────────┬───────────────────────────────────────────────────────────────────────────────┬───────────────────────────────────────────────────────┐       
  │        Route        │            Page file            │                               Stitch reference                                │                       API calls                       │
  ├─────────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────┤       
  │ /                   │ app/page.tsx                    │ boilersub_hero_v3_kinetic_update/code.html, boilerpulse_high_energy/code.html │ —                                                     │
  ├─────────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────┤
  │ /signup             │ app/signup/page.tsx             │ boilersub_create_account/code.html                                            │ auth.signup                                           │       
  ├─────────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────┤       
  │ /login              │ app/login/page.tsx              │ boilersub_login/code.html                                                     │ auth.login                                            │       
  ├─────────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────┤       
  │ /verify-email       │ app/verify-email/page.tsx       │ boilersub_email_verification/code.html                                        │ auth.verifyEmail, auth.resendEmailOtp                 │
  ├─────────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────┤       
  │ /verify-phone       │ app/verify-phone/page.tsx       │ boilersub_phone_verification/code.html                                        │ (stubbed — demo mode skips)                           │
  ├─────────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────┤       
  │ /verify-phone/code  │ app/verify-phone/code/page.tsx  │ boilersub_phone_verification_code/code.html                                   │ auth.verifyPhone, auth.resendPhoneOtp                 │
  ├─────────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────┤       
  │ /listings           │ app/listings/page.tsx           │ boilersub_listings_with_map_discovery/code.html                               │ listings.list                                         │
  ├─────────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────┤       
  │ /listings/[id]      │ app/listings/[id]/page.tsx      │ boilersub_listing_details/code.html                                           │ listings.getById, listings.delete                     │
  ├─────────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────┤       
  │ /listings/new       │ app/listings/new/page.tsx       │ list_your_sublease/code.html                                                  │ listings.create                                       │
  ├─────────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────┤       
  │ /listings/[id]/edit │ app/listings/[id]/edit/page.tsx │ boilersub_edit_listing/code.html                                              │ listings.getById, listings.update                     │
  ├─────────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────┤       
  │ /profile            │ app/profile/page.tsx            │ boilersub_my_profile/code.html                                                │ auth.me, users.updateMe                               │
  ├─────────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────┤       
  │ /profile/listings   │ app/profile/listings/page.tsx   │ boilersub_my_listings_dashboard/code.html                                     │ listings.list + client-filter by owner_id === user.id │
  ├─────────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────┤       
  │ /users/[id]         │ app/users/[id]/page.tsx         │ boilersub_public_profile/code.html                                            │ users.getById, listings.list + client-filter          │
  ├─────────────────────┼─────────────────────────────────┼───────────────────────────────────────────────────────────────────────────────┼───────────────────────────────────────────────────────┤       
  │ 404                 │ app/not-found.tsx               │ boilersub_404_page/code.html                                                  │ —                                                     │
  └─────────────────────┴─────────────────────────────────┴───────────────────────────────────────────────────────────────────────────────┴───────────────────────────────────────────────────────┘       
                                                   
  10.1 Porting recipe (repeat per page)                                                                                                                                                                   
                                                   
  1. Open stitch_purdue_sublease_connect/<folder>/code.html in a browser and inspect the layout.                                                                                                          
  2. Copy the <body> markup into the page.tsx return block, wrapped in a Server Component if no interactivity, or "use client" if it needs state (forms, buttons).
  3. Replace <a href="..."> with <Link href="..."> from next/link.                                                                                                                                        
  4. Replace the CDN Tailwind utility classes directly — they map 1:1 onto your local Tailwind once tailwind.config.ts has the brand colors.                                                              
  5. Remove the inline <script src="https://cdn.tailwindcss.com"> tag (Next handles Tailwind).                                                                                                            
  6. Replace the form <form action="..."> with onSubmit → call apiClient.                                                                                                                                 
  7. Material Symbols icons: either keep the Google Fonts import in app/layout.tsx (cheapest) or swap for lucide-react if you prefer proper React components.                                             
                                                                                                                                                                                                          
  10.2 Critical page — /signup (example full file)                                                                                                                                                        
                                                                                                                                                                                                          
  "use client";                                                                                                                                                                                           
  import { useState } from "react";                
  import { useRouter } from "next/navigation"; 
  import Link from "next/link";
  import { apiClient, ApiError } from "@/lib/apiClient";
                                                                                                                                                                                                          
  export default function SignupPage() {
    const router = useRouter();                                                                                                                                                                           
    const [email, setEmail] = useState("");        
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");                                                                                                                                                           
    const [err, setErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);                                                                                                                                                              
                                                                                                                                                                                                          
    async function onSubmit(e: React.FormEvent) {
      e.preventDefault();                                                                                                                                                                                 
      setErr(null);                                
                                               
      if (!/^[^@]+@purdue\.edu$/i.test(email)) return setErr("Use your @purdue.edu email.");                                                                                                              
      if (password.length < 8) return setErr("Password must be 8+ characters.");
      if (password !== confirm) return setErr("Passwords don't match.");                                                                                                                                  
                                                                                                                                                                                                          
      setBusy(true);                           
      try {                                                                                                                                                                                               
        await apiClient.auth.signup(email, password);
        window.sessionStorage.setItem("bs_pending_email", email);
        router.push("/verify-email");                                                                                                                                                                     
      } catch (e) {
        setErr(e instanceof ApiError ? e.message : "Signup failed");                                                                                                                                      
      } finally {                                                                                                                                                                                         
        setBusy(false);                        
      }                                                                                                                                                                                                   
    }                                              
                                               
    return (
      <main className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl shadow">
        <h1 className="font-display text-3xl mb-6">Create your BoilerSub account</h1>                                                                                                                     
        <form onSubmit={onSubmit} className="space-y-4">                                                                                                                                                  
          <input className="w-full border rounded-lg px-3 py-2"                                                                                                                                           
            type="email" placeholder="you@purdue.edu"                                                                                                                                                     
            value={email} onChange={(e) => setEmail(e.target.value)} required />                                                                                                                          
          <input className="w-full border rounded-lg px-3 py-2"                                                                                                                                           
            type="password" placeholder="Password (8+)"                                                                                                                                                   
            value={password} onChange={(e) => setPassword(e.target.value)} required />                                                                                                                    
          <input className="w-full border rounded-lg px-3 py-2"                                                                                                                                           
            type="password" placeholder="Confirm password"
            value={confirm} onChange={(e) => setConfirm(e.target.value)} required />                                                                                                                      
          {err && <p className="text-brand-coral text-sm">{err}</p>}
          <button disabled={busy}                                                                                                                                                                         
            className="w-full bg-brand-blue text-white rounded-lg py-2 disabled:opacity-60">
            {busy ? "Creating..." : "Create account"}                                                                                                                                                     
          </button>                                
        </form>                                                                                                                                                                                           
        <p className="mt-6 text-sm text-slate-600">
          Already registered? <Link href="/login" className="text-brand-blue underline">Log in</Link>                                                                                                     
        </p>
      </main>                                                                                                                                                                                             
    );                                             
  }                                            

  10.3 Critical page — /verify-email (demo mode, returns session directly)                                                                                                                                
   
  "use client";                                                                                                                                                                                           
  import { useState, useEffect } from "react";     
  import { useRouter } from "next/navigation";                                                                                                                                                            
  import { apiClient, ApiError } from "@/lib/apiClient";
  import { useAuth } from "@/context/AuthProvider";                                                                                                                                                       
   
  export default function VerifyEmailPage() {                                                                                                                                                             
    const router = useRouter();                    
    const { setSession } = useAuth();                                                                                                                                                                     
    const [email, setEmail] = useState("");
    const [token, setToken] = useState("");                                                                                                                                                               
    const [err, setErr] = useState<string | null>(null);                                                                                                                                                  
    const [busy, setBusy] = useState(false);   
                                                                                                                                                                                                          
    useEffect(() => {                              
      const pending = window.sessionStorage.getItem("bs_pending_email");
      if (pending) setEmail(pending);                                                                                                                                                                     
    }, []);
                                                                                                                                                                                                          
    async function onSubmit(e: React.FormEvent) {                                                                                                                                                         
      e.preventDefault();                      
      setBusy(true);                                                                                                                                                                                      
      setErr(null);                                
      try {                                    
        const data = await apiClient.auth.verifyEmail(email, token);
        // Demo mode: backend returns { session, user }                                                                                                                                                   
        if ("session" in data && data.session?.access_token && data.user) {
          setSession(data.session.access_token, data.user);                                                                                                                                               
          window.sessionStorage.removeItem("bs_pending_email");
          router.push("/listings");                                                                                                                                                                       
        } else {                                   
          // Non-demo: backend returns { status: "pending_phone_verification" }                                                                                                                           
          router.push("/verify-phone");                                                                                                                                                                   
        }                                      
      } catch (e) {                                                                                                                                                                                       
        setErr(e instanceof ApiError ? e.message : "Verification failed");
      } finally {                                                                                                                                                                                         
        setBusy(false);
      }                                                                                                                                                                                                   
    }                                              
                                               
    async function resend() {
      try {
        await apiClient.auth.resendEmailOtp(email);
      } catch (e) {                                                                                                                                                                                       
        setErr(e instanceof ApiError ? e.message : "Resend failed");
      }                                                                                                                                                                                                   
    }                                              
                                                                                                                                                                                                          
    return (
      <main className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl shadow">                                                                                                                           
        <h1 className="font-display text-2xl mb-2">Check your inbox</h1>
        <p className="text-sm text-slate-600 mb-6">We sent a 6-digit code to <b>{email}</b></p>                                                                                                           
        <form onSubmit={onSubmit} className="space-y-4">                                                                                                                                                  
          <input className="w-full border rounded-lg px-3 py-2 text-center tracking-widest font-mono text-xl"                                                                                             
            maxLength={6} value={token}                                                                                                                                                                   
            onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))} />                                                                                                                              
          {err && <p className="text-brand-coral text-sm">{err}</p>}                                                                                                                                      
          <button disabled={busy || token.length !== 6}                                                                                                                                                   
            className="w-full bg-brand-blue text-white rounded-lg py-2 disabled:opacity-60">                                                                                                              
            {busy ? "Verifying..." : "Verify"}                                                                                                                                                            
          </button>                            
        </form>                                                                                                                                                                                           
        <button onClick={resend} className="mt-4 text-sm text-brand-blue underline">Resend code</button>
      </main>                                                                                                                                                                                             
    );                                             
  }                                                                                                                                                                                                       
                                                   
  10.4 Critical page — /listings (Browse)                                                                                                                                                                 
   
  "use client";                                                                                                                                                                                           
  import { useEffect, useState } from "react";     
  import Link from "next/link";                
  import { apiClient, ApiError } from "@/lib/apiClient";
  import { useAuth } from "@/context/AuthProvider";                                                                                                                                                       
  import { useRouter } from "next/navigation";
                                                                                                                                                                                                          
  export default function ListingsPage() {                                                                                                                                                                
    const { status } = useAuth();              
    const router = useRouter();                                                                                                                                                                           
    const [rows, setRows] = useState<any[]>([]);   
    const [offset, setOffset] = useState(0);                                                                                                                                                              
    const limit = 20;
                                                                                                                                                                                                          
    useEffect(() => {                              
      if (status === "unauthenticated") router.push("/login");
    }, [status, router]);                                                                                                                                                                                 
   
    useEffect(() => {                                                                                                                                                                                     
      apiClient.listings.list(limit, offset).then(setRows).catch(() => {});
    }, [offset]);                                                                                                                                                                                         
   
    return (                                                                                                                                                                                              
      <main className="max-w-6xl mx-auto p-6">     
        <div className="flex items-center justify-between mb-6">                                                                                                                                          
          <h1 className="font-display text-3xl">Available Subleases</h1>
          <Link href="/listings/new"                                                                                                                                                                      
            className="bg-brand-blue text-white rounded-lg px-4 py-2">List your sublease</Link>
        </div>                                                                                                                                                                                            
        <div className="grid md:grid-cols-3 gap-4">
          {rows.map((l) => (                                                                                                                                                                              
            <Link key={l.id} href={`/listings/${l.id}`}                                                                                                                                                   
              className="bg-white rounded-xl p-4 shadow hover:shadow-md">
              <div className="aspect-video bg-slate-200 rounded-lg mb-3"></div>                                                                                                                           
              <h2 className="font-semibold">{l.title}</h2>
              <p className="text-brand-coral font-bold">${l.price}/mo</p>                                                                                                                                 
              <p className="text-sm text-slate-600">                                                                                                                                                      
                {l.start_date} → {l.end_date}                                                                                                                                                             
              </p>                                                                                                                                                                                        
              <p className="text-sm">{l.bedrooms} bd · {l.bathrooms} ba</p>
            </Link>                                                                                                                                                                                       
          ))}                                                                                                                                                                                             
        </div>                                                                                                                                                                                            
        <div className="mt-6 flex gap-3">                                                                                                                                                                 
          <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}
            className="px-4 py-2 border rounded-lg disabled:opacity-50">Previous</button>                                                                                                                 
          <button disabled={rows.length < limit} onClick={() => setOffset(offset + limit)}                                                                                                                
            className="px-4 py-2 border rounded-lg disabled:opacity-50">Next</button>                                                                                                                     
        </div>                                                                                                                                                                                            
      </main>                                                                                                                                                                                             
    );                                             
  }                                            

  10.5 Route guards                                                                                                                                                                                       
  
  Add src/components/ProtectedRoute.tsx:                                                                                                                                                                  
                                                   
  "use client";                                                                                                                                                                                           
  import { useAuth } from "@/context/AuthProvider";
  import { useRouter } from "next/navigation"; 
  import { useEffect } from "react";
                                                                                                                                                                                                          
  export function ProtectedRoute({ children, requireVerified = false }: {
    children: React.ReactNode;                                                                                                                                                                            
    requireVerified?: boolean;                     
  }) {                                                                                                                                                                                                    
    const { user, status, isFullyVerified } = useAuth();
    const router = useRouter();                                                                                                                                                                           
                                                   
    useEffect(() => {                                                                                                                                                                                     
      if (status === "unauthenticated") router.push("/login");
      if (requireVerified && status === "authenticated" && !isFullyVerified)                                                                                                                              
        router.push("/verify-email");                                                                                                                                                                     
    }, [status, isFullyVerified, requireVerified, router]);
                                                                                                                                                                                                          
    if (status === "loading") return <div className="p-10">Loading...</div>;                                                                                                                              
    if (status === "unauthenticated") return null;
    if (requireVerified && !isFullyVerified) return null;                                                                                                                                                 
    return <>{children}</>;                                                                                                                                                                               
  }                                            
                                                                                                                                                                                                          
  Wrap write-path pages (/listings/new, /listings/[id]/edit, /profile) with <ProtectedRoute requireVerified> and read-path pages (/listings, /profile/listings) with <ProtectedRoute>.                    
                                               
  ---                                                                                                                                                                                                     
  11. Endpoint Contract Map                        
                                                                                                                                                                                                          
  Every frontend call has exactly one backend route. This table is the contract.
                                                                                                                                                                                                          
  ┌─────────────────┬──────────────────────────────────┬──────────────────┬──────────────────────────────────────────────────────────────────────────────┬──────────────────────────────────────────┐     
  │ Frontend action │          Method + Path           │  Auth required   │                                 Body / Query                                 │              Response data               │     
  ├─────────────────┼──────────────────────────────────┼──────────────────┼──────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────┤     
  │ Signup          │ POST /api/v1/auth/signup         │ ✗                │ { email, password }                                                          │ { status, userId }                       │  
  ├─────────────────┼──────────────────────────────────┼──────────────────┼──────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────┤  
  │ Verify email    │ POST /api/v1/auth/verify-email   │ ✗                │ { email, token }                                                             │ Demo mode: { session, user } · Normal: { │     
  │ OTP             │                                  │                  │                                                                              │  status }                                │     
  ├─────────────────┼──────────────────────────────────┼──────────────────┼──────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────┤     
  │ Send phone OTP  │ POST /api/v1/auth/phone/send-otp │ ✓                │ { phone }                                                                    │ { status }                               │     
  ├─────────────────┼──────────────────────────────────┼──────────────────┼──────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────┤  
  │ Verify phone    │ POST /api/v1/auth/verify-phone   │ ✗                │ { phone, token }                                                             │ { session, user }                        │     
  │ OTP             │                                  │                  │                                                                              │                                          │  
  ├─────────────────┼──────────────────────────────────┼──────────────────┼──────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────┤     
  │ Login           │ POST /api/v1/auth/login          │ ✗                │ { email, password }                                                          │ { session, user }                        │  
  ├─────────────────┼──────────────────────────────────┼──────────────────┼──────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────┤     
  │ Logout          │ POST /api/v1/auth/logout         │ ✓                │ —                                                                            │ { status }                               │  
  ├─────────────────┼──────────────────────────────────┼──────────────────┼──────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────┤     
  │ Current user    │ GET /api/v1/auth/me              │ ✓                │ —                                                                            │ { user }                                 │  
  ├─────────────────┼──────────────────────────────────┼──────────────────┼──────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────┤     
  │ Resend email    │ POST                             │ ✗                │ { email }                                                                    │ { status }                               │  
  │ OTP             │ /api/v1/auth/resend-email-otp    │                  │                                                                              │                                          │     
  ├─────────────────┼──────────────────────────────────┼──────────────────┼──────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────┤  
  │ Resend phone    │ POST                             │ ✗                │ { phone }                                                                    │ { status }                               │     
  │ OTP             │ /api/v1/auth/resend-phone-otp    │                  │                                                                              │                                          │  
  ├─────────────────┼──────────────────────────────────┼──────────────────┼──────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────┤     
  │ Public profile  │ GET /api/v1/users/:id            │ ✓                │ —                                                                            │ User                                     │  
  ├─────────────────┼──────────────────────────────────┼──────────────────┼──────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────┤     
  │ Update own      │ PATCH /api/v1/users/me           │ ✓ (verified)     │ { full_name?, bio? }                                                         │ User                                     │  
  │ profile         │                                  │                  │                                                                              │                                          │     
  ├─────────────────┼──────────────────────────────────┼──────────────────┼──────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────┤  
  │ List listings   │ GET                              │ ✓                │ —                                                                            │ Listing[] (with owner hydrated)          │     
  │                 │ /api/v1/listings?limit&offset    │                  │                                                                              │                                          │  
  ├─────────────────┼──────────────────────────────────┼──────────────────┼──────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────┤     
  │ Single listing  │ GET /api/v1/listings/:id         │ ✓                │ —                                                                            │ Listing                                  │  
  ├─────────────────┼──────────────────────────────────┼──────────────────┼──────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────┤  
  │ Create listing  │ POST /api/v1/listings            │ ✓ (verified)     │ { title, description, price, start_date, end_date, bedrooms, bathrooms,      │ Listing                                  │  
  │                 │                                  │                  │ address, amenities }                                                         │                                          │  
  ├─────────────────┼──────────────────────────────────┼──────────────────┼──────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────┤
  │ Update listing  │ PATCH /api/v1/listings/:id       │ ✓ (verified,     │ Partial<ListingCreate>                                                       │ Listing                                  │     
  │                 │                                  │ owner)           │                                                                              │                                          │
  ├─────────────────┼──────────────────────────────────┼──────────────────┼──────────────────────────────────────────────────────────────────────────────┼──────────────────────────────────────────┤     
  │ Delete listing  │ DELETE /api/v1/listings/:id      │ ✓ (verified,     │ —                                                                            │ { ok: true }                             │
  │                 │                                  │ owner)           │                                                                              │                                          │     
  └─────────────────┴──────────────────────────────────┴──────────────────┴──────────────────────────────────────────────────────────────────────────────┴──────────────────────────────────────────┘
                                                                                                                                                                                                          
  Response envelope everywhere:                                                                                                                                                                           
  - Success: { "success": true, "data": <T> }  
  - Error: { "success": false, "error": { "code": "snake_case", "message": "Human-readable" } }                                                                                                           
                                                                                               
  Auth header on protected routes: Authorization: Bearer <supabase_access_token>.                                                                                                                         
                                                                                                                                                                                                          
  ---                                                                                                                                                                                                     
  12. Auth Flow (Demo Mode Sequence)                                                                                                                                                                      
                                                                                                                                                                                                          
  Frontend                    Backend                   Supabase
     │                           │                          │                                                                                                                                             
     │  POST /auth/signup        │                          │
     ├──────────────────────────►│                          │                                                                                                                                             
     │                           │  auth.signUp()           │
     │                           ├─────────────────────────►│                                                                                                                                             
     │                           │                          │
     │                           │                          │──► email with 6-digit OTP                                                                                                                   
     │  { status: pending_... }  │                          │                                                                                                                                             
     │◄──────────────────────────┤                          │                                                                                                                                             
     │  → navigate /verify-email │                          │                                                                                                                                             
     │                           │                          │                                                                                                                                             
     │  POST /auth/verify-email  │                          │
     │  { email, token }         │                          │                                                                                                                                             
     ├──────────────────────────►│                          │                                                                                                                                             
     │                           │  auth.verifyOtp()        │
     │                           ├─────────────────────────►│                                                                                                                                             
     │                           │◄──── { user, session } ──┤                                                                                                                                             
     │                           │  markFullyVerified()     │                                                                                                                                             
     │                           ├─────────────────────────►│                                                                                                                                             
     │  { session, user }        │                          │                                                                                                                                             
     │◄──────────────────────────┤                          │                                                                                                                                             
     │  localStorage.setItem     │                          │
     │  → navigate /listings     │                          │                                                                                                                                             
     │                           │                          │                                                                                                                                             
     │  GET /listings            │                          │
     │  Bearer <token>           │                          │                                                                                                                                             
     ├──────────────────────────►│                          │                                                                                                                                             
     │                           │  requireAuth middleware  │
     │                           │  validates JWT           │                                                                                                                                             
     │                           │  listingRepo.findAll()   │
     │                           ├─────────────────────────►│                                                                                                                                             
     │  { success: true, data }  │                          │
     │◄──────────────────────────┤                          │                                                                                                                                             
                                                   
  In non-demo mode (SKIP_PHONE_VERIFICATION=false), /auth/verify-email returns { status: "pending_phone_verification" } and the frontend routes to /verify-phone.                                         
                                                   
  ---                                                                                                                                                                                                     
  13. CORS + Token Handling                        
                                                                                                                                                                                                          
  - Backend src/index.ts line 33: app.use(cors({ origin: env.CORS_ORIGIN, credentials: true })).
  - Backend .env: CORS_ORIGIN=http://localhost:3000.                                                                                                                                                      
  - Token lives in localStorage under key bs_access_token.                                                                                                                                                
  - User snapshot lives under bs_user for hydration-without-flicker.                                                                                                                                      
  - On every 401, apiClient clears both keys and redirects to /login.                                                                                                                                     
  - On logout, frontend calls POST /auth/logout then clears localStorage.                                                                                                                                 
  - Tokens expire per Supabase settings (default 1h). For the demo we don't refresh — expired token → 401 → re-login. To add refresh, persist the refresh_token and call supabase.auth.refreshSession()   
  through a new /auth/refresh backend endpoint.                                                                                                                                                           
                                                                                                                                                                                                          
  ---                                                                                                                                                                                                     
  14. Running Locally End-to-End                   
                                               
  Two terminals:
                                                                                                                                                                                                          
  Terminal A — backend:
  cd /Users/archeet/Desktop/BoilerSub                                                                                                                                                                     
  npm run dev                                      
                                                                                                                                                                                                          
  Terminal B — frontend:
  cd /Users/archeet/Desktop/BoilerSub/boilersub-frontend                                                                                                                                                  
  npm run dev                                           
                                                                                                                                                                                                          
  Visit http://localhost:3000 and walk:            
                                                                                                                                                                                                          
  1. / → click "Sign Up with Purdue Email"                                                                                                                                                                
  2. /signup → enter yourname@purdue.edu + password                                                                                                                                                       
  3. Check inbox for 6-digit OTP                                                                                                                                                                          
  4. /verify-email → enter OTP → auto-redirects to /listings                                                                                                                                              
  5. /listings → see seeded rows                                                                                                                                                                          
  6. Click a listing → /listings/[id] → view details                                                                                                                                                      
  7. Click "List your sublease" → /listings/new → create one                                                                                                                                              
  8. /profile/listings → see your new listing      
  9. Edit / delete it                                                                                                                                                                                     
  10. Logout from the profile page → back to /login                                                                                                                                                       
                                                                                                                                                                                                          
  If any step errors, check the backend terminal for the structured log line containing requestId and error.code.                                                                                         
                                                   
  ---                                                                                                                                                                                                     
  15. Smoke-Test Checklist                         
                                                                                                                                                                                                          
  Before declaring "done", walk this list with the frontend in a browser and the backend log tailing in another terminal:
                                                                                                                                                                                                          
  - curl http://localhost:4000/health returns {success:true}                                                                                                                                              
  - Signup with a non-@purdue.edu email → rejected with invalid_email or validation_error                                                                                                                 
  - Signup with @purdue.edu → email arrives within 60s                                                                                                                                                    
  - Verify-email with wrong token → email_verification_failed                                                                                                                                             
  - Verify-email with correct token → session returned, fully_verified: true, redirected to /listings                                                                                                     
  - /listings loads seeded rows (check rows.length > 0)                                                                                                                                                   
  - Click into a listing → detail page loads with title/price/owner                                                                                                                                       
  - Create a new listing → appears in /listings grid on refresh                                                                                                                                           
  - Edit own listing → changes persist                                                                                                                                                                    
  - Delete own listing → disappears from grid                                                                                                                                                             
  - Attempt to edit someone else's listing (change URL manually) → 403 forbidden                                                                                                                          
  - Profile → update full_name/bio → persists after reload                                                                                                                                                
  - Logout → localStorage cleared → redirected to /login                                                                                                                                                  
  - Try /listings while logged out → redirected to /login                                                                                                                                                 
  - Rate limit: fire 11+ signups from the same IP in an hour → 11th returns signup_rate_limited                                                                                                           
                                                                                                                                                                                                          
  ---                                                                                                                                                                                                     
  16. Sharing via ngrok                                                                                                                                                                                   
                                                                                                                                                                                                          
  Backend and frontend each need their own tunnel.
                                                                                                                                                                                                          
  Terminal C — backend tunnel:                     
  ngrok http 4000                                                                                                                                                                                         
  # copy the https URL: e.g. https://abcd-1234.ngrok-free.app
                                               
  Terminal D — frontend tunnel:                                                                                                                                                                           
  ngrok http 3000
  # copy the https URL: e.g. https://wxyz-5678.ngrok-free.app                                                                                                                                             
                                                   
  Then update the running instances:                                                                                                                                                                      
   
  1. Edit boilersub-frontend/.env.local:                                                                                                                                                                  
  NEXT_PUBLIC_API_BASE_URL=https://abcd-1234.ngrok-free.app/api/v1
  2. Edit /Users/archeet/Desktop/BoilerSub/.env:                                                                                                                                                          
  CORS_ORIGIN=https://wxyz-5678.ngrok-free.app                                                                                                                                                            
  3. Restart both dev servers (Ctrl-C then npm run dev).                                                                                                                                                  
  4. Share https://wxyz-5678.ngrok-free.app — anyone opening it gets the full app talking to your Supabase project.                                                                                       
                                                                                                                                                                                                          
  ngrok gotchas:                                                                                                                                                                                          
  - Free tier rotates URLs per session → update env vars each restart, or get a reserved domain (free with account).                                                                                      
  - Supabase emails that link to /verify-email don't matter here since we're using OTP codes, not magic links.                                                                                            
  - If you see CORS errors in browser devtools, double-check the frontend ngrok URL exactly matches CORS_ORIGIN (no trailing slash).
  - Ngrok free adds a warning interstitial on first visit — share via a short explanation or pay for the removed-warning tier.                                                                            
                                                                                                                                                                                                          
  ---                                                                                                                                                                                                     
  17. Troubleshooting                                                                                                                                                                                     
                                                                                                                                                                                                          
  ┌──────────────────────────────────────────────────┬──────────────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────────────────────────┐  
  │                     Symptom                      │                              Cause                               │                                    Fix                                     │    
  ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤  
  │ Backend exits at startup with ZodError on env    │ Missing or empty env var                                         │ Fill .env per §5, restart                                                  │  
  ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤  
  │ CORS error in browser devtools                   │ CORS_ORIGIN mismatch or missing scheme                           │ Match frontend origin exactly, include http://                             │    
  ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤    
  │ Signup returns invalid_email                     │ Using non-Purdue email                                           │ Use @purdue.edu address                                                    │    
  ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤    
  │ Verify-email returns email_verification_failed   │ Expired token, wrong token, or confirmation URL mode still       │ Check §4.1 (OTP mode), resend code                                         │  
  │                                                  │ enabled                                                          │                                                                            │    
  ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤  
  │ Login returns verification_required              │ User not fully verified (demo flag off, phone not confirmed)     │ Set SKIP_PHONE_VERIFICATION=true and restart backend, or complete phone    │    
  │                                                  │                                                                  │ step                                                                       │  
  ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤    
  │ Create listing returns verification_required     │ Same as above                                                    │ Same fix                                                                   │  
  ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤    
  │ All listings requests return 401                 │ Token missing / expired                                          │ Re-login; inspect localStorage.bs_access_token in devtools                 │  
  ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤    
  │ 42501 Postgres RLS error in backend logs         │ RLS policy blocks the row                                        │ Verify 004_rls_policies.sql was applied via §4.5                           │  
  ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤    
  │ Frontend shows empty listings grid               │ Seed didn't run                                                  │ npm run seed from backend folder                                           │
  ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤    
  │ Next.js reports Module not found:                │ Path alias missing                                               │ Ensure tsconfig.json has "paths": { "@/*": ["./src/*"] }                   │
  │ @/lib/apiClient                                  │                                                                  │                                                                            │    
  ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤
  │ Tailwind classes do nothing                      │ Not scanning src/                                                │ Add "./src/**/*.{ts,tsx}" to content in tailwind.config.ts                 │
  ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤    
  │ Stitch pages render unstyled                     │ Copy-pasted the CDN <script> tag                                 │ Remove the https://cdn.tailwindcss.com script; use local Tailwind only     │
  ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤    
  │ 500 on all endpoints with PGRST301 / JWT expired │ Clock skew on Supabase token                                     │ Re-login                                                                   │
  ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤    
  │ Backend node_modules missing                     │ Not installed                                                    │ npm install in the repo root                                               │
  ├──────────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────┤    
  │ Port already in use                              │ Leftover process                                                 │ `lsof -ti:4000                                                             │
  └──────────────────────────────────────────────────┴──────────────────────────────────────────────────────────────────┴────────────────────────────────────────────────────────────────────────────┘    
                                                   
  ---                                                                                                                                                                                                     
  18. Going Past Demo                              
                                                                                                                                                                                                          
  When you're ready to lift demo constraints:
                                                                                                                                                                                                          
  - Re-enable phone verification: set SKIP_PHONE_VERIFICATION=false, configure Twilio in Supabase Auth → Providers → Phone, restart backend. The existing /verify-phone* pages and endpoints are wired and
   will Just Work.                             
  - Add Features A–E from FRONT.md (search, 3D previews, chat, chatbot, swipe UI) — each slots into existing structure without rewrites per PLAN2.md §17.                                                 
  - Token refresh: add /auth/refresh endpoint that accepts refresh_token and returns a new access/refresh pair; frontend intercepts 401 to call it before redirecting.                                    
  - Hosted deploys:                                                                                                                                                                                       
    - Frontend → Vercel (free, auto HTTPS, set NEXT_PUBLIC_API_BASE_URL to backend URL in env)                                                                                                            
    - Backend → Render / Railway / Fly.io (Express works out of the box; set all env vars from §5)                                                                                                        
    - Keep Supabase as-is — no migration.                                                                                                                                                                 
  - Observability: pipe the backend JSON logs to Logtail or Grafana Loki using their docker run or vector sidecar.                                                                                        
  - Cost: everything in this stack stays free — Supabase free tier (500MB Postgres, 50k MAUs), Vercel hobby tier, Render free web service (spins down after 15 min idle).                                 
                                                                                                                                                                                                          
  ---                                                                                                                                                                                                     
  19. Quick Reference Card                                                                                                                                                                                
                                                                                                                                                                                                          
  Backend dir         /Users/archeet/Desktop/BoilerSub
  Backend dev         npm run dev               (http://localhost:4000)                                                                                                                                   
  Backend build       npm run build && npm start                                                                                                                                                          
  Backend seed        npm run seed                                                                                                                                                                        
                                                                                                                                                                                                          
  Frontend dir        /Users/archeet/Desktop/BoilerSub/boilersub-frontend                                                                                                                                 
  Frontend dev        npm run dev               (http://localhost:3000)
                                                                                                                                                                                                          
  Envelope            { success, data } | { success, error: { code, message } }                                                                                                                           
  Auth header         Authorization: Bearer <access_token>
  API base            http://localhost:4000/api/v1                                                                                                                                                        
  Supabase URL        https://ifzyddzpotkufndkwgyv.supabase.co                                                                                                                                            
                                                                                                                                                                                                          
  Demo flag           SKIP_PHONE_VERIFICATION=true                                                                                                                                                        
  CORS origin         http://localhost:3000                                                                                                                                                               
                                                                                                                                                                                                          
  ngrok backend       ngrok http 4000  → set CORS_ORIGIN to frontend ngrok URL                                                                                                                            
  ngrok frontend      ngrok http 3000  → set NEXT_PUBLIC_API_BASE_URL to backend ngrok URL
                                                                                                                                                                                                          
  ---                                              
  This integration guide maps exactly to the backend verified by graphify-out/graph.json (78 files, 128 nodes, 92 edges, built 2026-04-10) and the frontend spec in FRONT.md, with demo-mode patches      
  applied to the auth flow so the app reaches a runnable state without SMS infrastructure. Every endpoint listed has been cross-checked against src/routes/*.ts, and every stitch HTML in                 
  stitch_purdue_sublease_connect/ has a corresponding Next.js page above.                                                                                                                 
  ```      
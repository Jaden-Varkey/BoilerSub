# BoilerSub

BoilerSub is a full-stack Purdue-only sublease marketplace built to help students safely discover, list, and manage apartment subleases inside a closed campus network. The project combines a Next.js frontend, an Express + TypeScript backend, Supabase authentication/data storage, and a Stitch-guided UI workflow to create a polished housing platform that is already functional in core flows and positioned for future public deployment and mobile expansion.

## Table of Contents

- [Overview](#overview)
- [What is Implemented Today](#what-is-implemented-today)
- [What is Still Roadmap / Not Fully Implemented Yet](#what-is-still-roadmap--not-fully-implemented-yet)
- [Why This Project Matters](#why-this-project-matters)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Directory Structure](#directory-structure)
- [Core User Flows](#core-user-flows)
- [API Surface](#api-surface)
- [Data Model](#data-model)
- [Authentication and Verification Model](#authentication-and-verification-model)
- [Frontend Design and UI Workflow](#frontend-design-and-ui-workflow)
- [AI-Assisted Development Workflow](#ai-assisted-development-workflow)
- [Engineering Skills Demonstrated](#engineering-skills-demonstrated)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Seed Data](#seed-data)
- [Running the App End-to-End](#running-the-app-end-to-end)
- [Deployment Notes](#deployment-notes)
- [Security Notes](#security-notes)
- [Current Limitations](#current-limitations)
- [Roadmap](#roadmap)
- [Resume / Portfolio Framing](#resume--portfolio-framing)
- [License](#license)

---

## Overview

BoilerSub is designed for Purdue students who need a more trustworthy way to find or post apartment subleases near campus. Instead of relying on scattered messages, informal chats, or generic marketplaces, BoilerSub introduces a Purdue-only gated system where verified users can browse listings, manage profiles, and publish sublease opportunities in a more structured and student-focused environment.

This repository contains both:

1. **A backend API** for authentication, user profiles, and listing management
2. **A frontend web app** for onboarding, browsing, listing creation, and profile management

The long-term goal is to take this from a strong prototype / functional MVP into a production-ready product on a real domain, followed by a mobile app experience.

---

## What is Implemented Today

The current codebase already supports the core marketplace experience:

- Purdue-only signup and login flow (`@purdue.edu` email restriction)
- Email OTP verification flow
- Phone verification flow support in architecture
- Demo mode that can skip full phone verification for easier testing
- Authenticated session handling with token persistence in the frontend
- User profile viewing and updating
- Listing creation, browsing, detail viewing, editing, and deletion
- Ownership checks so only the owner can modify or delete a listing
- Shared frontend API client with typed request wrappers
- Seed script for demo users and listings
- Route-by-route Stitch-inspired UI implementation across major pages
- A refined shared navigation/chrome system across the frontend

At a product level, this means the project is **not just a static mockup**. It already behaves like a real full-stack application in the most important flows.

---

## What is Still Roadmap / Not Fully Implemented Yet

A few features are described in planning docs but are not fully shipped yet. These should be treated as roadmap items, not current functionality:

- Advanced search and richer filters beyond pagination
- Interactive 3D / panoramic apartment preview pipeline
- Real in-app messaging between listers and subletters
- LLM-powered recommendation assistant / chatbot
- Tinder-style swipe discovery UX
- Full production deployment hardening
- Mobile application client
- True phone/SMS production verification infrastructure
- Fully functional map-based discovery layer

There are also a few UI placeholders today:

- The **“View 3D”** button currently opens a placeholder page
- Some design-driven screens are visually integrated but still rely on existing backend logic beneath them
- A few routes are still in transition from functional-first views to final stitched UI variants

---

## Why This Project Matters

Subleasing is a real student pain point. Students often need to leave leases early, study abroad, transfer, intern elsewhere, or move housing between semesters. At the same time, other students need short-term housing with better trust, more clarity, and less friction.

BoilerSub solves a practical problem by creating a more reliable discovery engine specifically for the Purdue ecosystem. It is both a product idea and an engineering project: it demonstrates authentication, authorization, data modeling, frontend/backend integration, API design, route protection, polished UI adaptation, and a roadmap from prototype to deployable software.

---

## Tech Stack

### Core Stack

- **Backend Language:** TypeScript
- **Backend Runtime:** Node.js
- **Backend Framework:** Express
- **Frontend Framework:** Next.js 14 (App Router)
- **Frontend Library:** React 18
- **Styling:** Tailwind CSS
- **Database / Auth Platform:** Supabase
- **Validation:** Zod
- **Security Middleware:** Helmet, CORS
- **Developer Tooling:** TSX, TypeScript compiler, ESLint

### Backend Dependencies

- `express`
- `cors`
- `helmet`
- `dotenv`
- `zod`
- `@supabase/supabase-js`
- `@google/genai`
- `@google/stitch-sdk`

### Frontend Dependencies

- `next`
- `react`
- `react-dom`
- `tailwindcss`
- `typescript`
- `eslint`
- `eslint-config-next`

### Design / Agent Tooling

- **Google Stitch** for UI ideation and screen generation workflows
- **Graphify TS** for codebase graph/report generation
- **Claude Code / Codex-style agent workflows** for iterative implementation, refactors, and route-by-route handoff-driven development

### Suggested Production Hosting Direction

While the repository does not include a finalized production deployment config yet, the current architecture is well suited for:

- **Frontend:** Vercel
- **Backend:** Render, Railway, Fly.io, or another Node-compatible host
- **Database/Auth:** Supabase

---

## Architecture

BoilerSub uses a clean split between a frontend application and a backend API.

### High-Level System Design

```text
Next.js Frontend (port 3000)
        |
        | HTTPS + Bearer token
        v
Express API (port 4000)
        |
        | Repository / service layer
        v
Supabase (Postgres + Auth + RLS)
```

### Backend Architecture

The backend follows a layered structure:

```text
routes -> controllers -> services -> repositories -> Supabase
```

This separation keeps responsibilities clear:

- **Routes** define endpoint paths and middleware chaining
- **Controllers** translate HTTP requests into service calls
- **Services** hold business logic and authorization rules
- **Repositories** handle data access and database mapping
- **Supabase** acts as the underlying auth + data platform

### Frontend Architecture

The frontend is a Next.js App Router project that centralizes all backend communication through a single `apiClient.ts` module. Auth state is managed through React Context, and protected pages rely on route guards / auth checks to prevent invalid access.

### API Contract Philosophy

The backend uses a stable success/error envelope pattern:

```json
{ "success": true, "data": ... }
```

or

```json
{ "success": false, "error": { "code": "...", "message": "..." } }
```

This makes frontend error handling far cleaner and keeps response behavior consistent across endpoints.

---

## Directory Structure

```text
BoilerSub/
├── src/                               # Express backend source
│   ├── config/                        # Environment + Supabase config
│   ├── controllers/                   # Route controllers
│   ├── lib/                           # Shared backend helpers
│   ├── middleware/                    # Auth, validation, logging, error handling
│   ├── repositories/                  # Data access layer
│   ├── routes/                        # API route definitions
│   ├── schemas/                       # Zod request validation schemas
│   ├── services/                      # Business logic layer
│   ├── types/                         # Shared backend types
│   └── index.ts                       # Backend entrypoint
├── scripts/
│   └── seed.ts                        # Demo data seeding script
├── supabase/
│   └── migrations/                    # SQL migrations + RLS policies
├── boilersub-frontend/                # Next.js frontend app
│   ├── src/app/                       # App Router pages
│   ├── src/components/                # Shared UI components
│   ├── src/context/                   # Auth provider
│   ├── src/hooks/                     # Custom React hooks
│   ├── src/lib/                       # API client, types, utilities
│   ├── package.json
│   └── next.config.mjs
├── stitch-ui-design/                  # Stitch prompt/design workflow docs
├── PRD.md                             # Product / backend vision
├── FRONT.md                           # Frontend PRD
├── INTEGRATION.md                     # Full integration runbook
├── CONNECTION.md                      # Agent handoff / state doc
├── package.json                       # Backend package manifest
└── tsconfig.json                      # Backend TypeScript config
```

---

## Core User Flows

### 1. User Signup

A user signs up with a Purdue email and password. The backend validates that the email ends with `@purdue.edu`.

### 2. Email Verification

The user receives a 6-digit code and verifies the account through the email OTP screen.

### 3. Phone Verification / Demo Mode

The architecture supports phone verification, but for current demo/development workflows the backend can skip that requirement and mark the user as fully verified immediately after email verification.

### 4. Session Creation

After verification or login, the frontend stores the access token and a user snapshot in local storage.

### 5. Listing Discovery

An authenticated user can browse listings, page through results, and view details of a specific listing.

### 6. Listing Management

A verified user can create, edit, and delete their own listings.

### 7. Profile Management

A user can update core profile fields like full name and bio.

---

## API Surface

### Auth Endpoints

- `POST /api/v1/auth/signup`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/phone/send-otp`
- `POST /api/v1/auth/verify-phone`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/resend-email-otp`
- `POST /api/v1/auth/resend-phone-otp`
- `GET /api/v1/auth/me`

### User Endpoints

- `GET /api/v1/users/:id`
- `PATCH /api/v1/users/me`

### Listing Endpoints

- `GET /api/v1/listings?limit=&offset=`
- `GET /api/v1/listings/:id`
- `POST /api/v1/listings`
- `PATCH /api/v1/listings/:id`
- `DELETE /api/v1/listings/:id`

### Health Endpoint

- `GET /health`

---

## Data Model

### Users Table

Key fields include:

- `id`
- `email`
- `phone`
- `full_name`
- `bio`
- `email_verified`
- `phone_verified`
- `fully_verified`
- `role`
- `created_at`
- `updated_at`

### Listings Table

Key fields include:

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

### Database Protections

The project enables Supabase Row-Level Security (RLS) so that:

- authenticated users can read allowed records
- users can only update their own profile
- users can only insert/update/delete their own listings

---

## Authentication and Verification Model

BoilerSub uses Supabase Auth, but the frontend does **not** talk directly to Supabase. Instead:

1. The frontend calls the Express backend
2. The backend communicates with Supabase Auth / Postgres
3. The backend returns a stable response envelope
4. The frontend stores the returned access token

### Why this design matters

This keeps business logic centralized on the backend and avoids spreading privileged auth/data logic throughout the frontend.

### Verification states

The user model explicitly tracks:

- email verification
- phone verification
- fully verified status

This enables stricter write-path protections for listing creation and editing.

---

## Frontend Design and UI Workflow

A major part of BoilerSub is not just what it does technically, but how the UX was built.

The repo includes Stitch-oriented design documentation and handoff notes showing that the frontend was implemented route-by-route using generated or guided UI references. This means the project was developed with a strong design-to-code workflow rather than purely ad hoc screens.

### Routes already mapped to Stitch-style implementation

Core pages in the frontend include:

- `/`
- `/login`
- `/signup`
- `/verify-email`
- `/verify-phone`
- `/verify-phone/code`
- `/listings`
- `/listings/new`
- `/listings/[id]`
- `/listings/[id]/edit`
- `/profile`
- `/profile/listings`
- `/users/[id]`
- `not-found`

### Notable UI implementation details

- Shared site chrome and navigation across most pages
- Standalone auth surfaces without the shared navbar/footer
- Rich visual landing page
- Styled browse grid and listing detail pages
- Profile and dashboard pages with more polished layouts than a raw CRUD app
- Remote image support configured for Google-hosted assets

---

## AI-Assisted Development Workflow

This project is a good example of **AI-assisted software engineering used responsibly**.

### Workflow used in practice

- **Google Stitch** was used for UI ideation and design-to-code prompting workflows
- **Claude Code / Codex-style agent workflows** were used for implementation support, refactors, and route-by-route integration
- **Agent handoff documents** (`CONNECTION.md`) were used to preserve project context between implementation sessions
- **Graphify** tooling was used to generate code graph/build artifacts for repo understanding

### Important honesty note

This README intentionally distinguishes between:

- tools/workflows clearly evidenced by the repository and surrounding docs
- specific MCP server names that are **not** explicitly checked into this repository

If you list this project on a resume or portfolio, it is accurate to say the project used:

- AI-assisted coding workflows
- design-to-code tooling
- multi-agent / handoff-oriented iteration

It is **not** ideal to claim a specific MCP integration unless you actually configured and used that MCP yourself in your dev environment.

### Safe resume wording for AI tooling

Good wording:

- “Used AI-assisted development workflows (Claude Code / Codex style iteration) to accelerate route-by-route frontend integration, debugging, and refactoring.”
- “Used Google Stitch-driven design references to translate UI concepts into working React/Next.js screens.”
- “Used agent handoff and repo graphing workflows to maintain continuity across iterative implementation sessions.”

---

## Engineering Skills Demonstrated

This project demonstrates real technical breadth.

### Backend Skills

- REST API design
- TypeScript backend development
- Express middleware composition
- repository/service architecture
- request validation with Zod
- authentication and authorization
- integration with Supabase Auth and Postgres
- secure CRUD logic and ownership enforcement
- logging and structured error handling

### Frontend Skills

- Next.js App Router development
- React state and context management
- token-based client session handling
- protected routes and UX gating
- reusable UI component architecture
- Tailwind CSS implementation
- frontend/backend contract integration
- route-by-route UI migration and design adaptation

### Product / System Skills

- marketplace product thinking
- authentication-first trust design
- student-centered UX
- MVP scoping
- roadmap separation between shipped features and future features
- integration documentation and handoff discipline

### AI / Automation Skills

- design-to-code translation using Google Stitch
- AI-assisted debugging and implementation
- agent handoff workflow design
- codebase analysis tooling
- practical use of AI as an engineering multiplier rather than a substitute for architecture decisions

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Jaden-Varkey/BoilerSub.git
cd BoilerSub
```

### 2. Install Backend Dependencies

From the repo root:

```bash
npm install
```

### 3. Install Frontend Dependencies

```bash
cd boilersub-frontend
npm install
cd ..
```

### 4. Configure Backend Environment

Create a backend `.env` file from the example:

```bash
cp .env.example .env
```

Then replace the example values with your own valid values.

### 5. Configure Frontend Environment

```bash
cp boilersub-frontend/.env.local.example boilersub-frontend/.env.local
```

Default value:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
```

### 6. Start the Backend

From the repo root:

```bash
npm run dev
```

The backend should run on:

```text
http://localhost:4000
```

Quick health check:

```bash
curl http://localhost:4000/health
```

### 7. Start the Frontend

In a second terminal:

```bash
cd boilersub-frontend
npm run dev
```

The frontend should run on:

```text
http://localhost:3000
```

---

## Environment Variables

### Backend `.env`

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_ANON_KEY` | Supabase anon/public key used by backend auth requests |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key for server-side privileged operations |
| `GOOGLE_API_KEY` | Optional Google API key for Stitch / GenAI tooling |
| `GOOGLE_STITCH_MODEL` | Google model name for Stitch-related tooling |
| `PORT` | Backend port, default `4000` |
| `NODE_ENV` | `development`, `test`, or `production` |
| `CORS_ORIGIN` | Frontend origin allowed to call the backend |
| `LOG_LEVEL` | Logging verbosity |
| `SKIP_PHONE_VERIFICATION` | Whether email verification immediately marks the user fully verified |

### Frontend `.env.local`

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for the backend API |

### Important security recommendation

Do **not** commit real secrets. If any real keys were ever placed in example files during development, rotate them and replace examples with sanitized placeholders before production release.

---

## Seed Data

The repository includes a `scripts/seed.ts` file that creates demo users and listings.

Run it from the repo root:

```bash
npm run seed
```

What it does:

- creates / upserts demo Purdue users
- marks them verified
- inserts demo listing data
- provides a fast way to test browse/detail/profile flows without manual setup

---

## Running the App End-to-End

Once both frontend and backend are running:

1. Open `http://localhost:3000`
2. Sign up with a Purdue email
3. Verify using the email OTP flow
4. Browse listings
5. Open a listing detail page
6. Create a new listing
7. Edit or delete your own listing
8. Update your profile

This gives you a full walkthrough of the current MVP experience.

---

## Deployment Notes

### Current Recommended Split

For production or portfolio deployment, the cleanest path is:

- **Frontend:** Vercel
- **Backend:** Render / Railway / Fly.io
- **Database/Auth:** Supabase

### Why this split makes sense

- Next.js frontend is a natural fit for Vercel
- Express backend can stay independently deployable
- Supabase already handles database + auth well
- the split keeps the frontend lightweight and the backend secure

### Development Sharing

The integration docs also describe using ngrok to expose both frontend and backend for demos.

---

## Security Notes

This project already shows good security instincts in several places:

- Purdue-only email restriction at signup
- backend-side auth and business logic instead of direct frontend DB access
- route protection for authenticated/verified flows
- RLS in Supabase for users/listings
- ownership checks for listing mutation actions
- rate limiting on signup/login/verification endpoints
- structured validation with Zod
- security middleware via Helmet and CORS

Before a real public launch, you should still review:

- secret rotation and sanitization
- production logging policy
- abuse prevention / spam mitigation
- file upload handling strategy
- refresh token strategy
- stricter content moderation / report flows

---

## Current Limitations

This README is intentionally honest about current limitations:

- The product is currently web-first, not mobile
- The 3D experience is not yet a real production pipeline
- In-app messaging is not live yet
- Some advanced search/discovery features are still future work
- Some design components are visually integrated but still backed by interim logic
- Demo mode can bypass full phone verification for local development
- Production deployment configuration is not yet finalized in-repo

---

## Roadmap

### Near-Term

- finish remaining Stitch-aligned route conversions
- deploy the platform publicly on a real domain
- improve listing search/filter quality
- replace demo placeholders with functional components
- tighten auth and profile polish

### Medium-Term

- add richer listing media and a real 3D/panorama workflow
- add lister-to-renter messaging
- improve recommendation and discovery logic
- build analytics/admin tooling

### Long-Term

- ship a mobile app
- expand beyond MVP into a true trusted student housing platform
- add smarter ranking, personalization, and verification flows

---

## Resume / Portfolio Framing

If you are using BoilerSub on a resume, this project is strongest when framed as a **full-stack product with real user value**, not just as a class project or UI prototype.

### Suggested project description

> Built BoilerSub, a Purdue-only full-stack sublease marketplace using Next.js, React, Express, TypeScript, and Supabase; implemented authenticated user onboarding, profile management, and listing CRUD flows, with route-level UI integration guided by Google Stitch design workflows.

### Strong technical bullet options

- Designed and integrated a full-stack housing marketplace with a Next.js frontend, Express/TypeScript backend, Supabase authentication, and protected listing CRUD workflows.
- Implemented Purdue-only user verification, session management, profile editing, and ownership-based authorization for marketplace listings.
- Built a reusable API client and React auth context layer to connect frontend flows cleanly to backend endpoints.
- Used AI-assisted development and Stitch-guided design-to-code workflows to accelerate polished route-by-route UI implementation.
- Structured the backend using layered architecture (routes, controllers, services, repositories) for maintainability and production readiness.

### Skills you can honestly associate with this project

**Languages / Frameworks**

- TypeScript
- JavaScript
- Node.js
- Express
- React
- Next.js
- Tailwind CSS
- SQL / Supabase

**Software Engineering Skills**

- Full-stack development
- REST API design
- authentication / authorization
- frontend/backend integration
- state management
- route protection
- validation and error handling
- database schema design
- product prototyping
- design-to-code implementation

**AI / Tooling Skills**

- Google Stitch
- AI-assisted coding workflows
- prompt-guided UI iteration
- codebase handoff / agent workflow design
- repo graph analysis

### Important resume advice

On your resume, avoid overselling unfinished roadmap features as though they are already shipped. The strongest version is:

- clearly claim what works today
- describe the roadmap as future product direction
- emphasize both engineering depth and real-world usefulness

---

## License

No license is currently defined in this repository. Add a license before open-source distribution or broader reuse.

---

## Final Note

BoilerSub stands out because it is more than a CRUD demo and more than a design mockup. It already combines product thinking, full-stack engineering, authentication, authorization, route-driven UX, and AI-assisted implementation workflows in a way that makes it a strong portfolio project today—and a very credible startup / real-user product candidate with further deployment and iteration.

# BoilerSub — Frontend PRD (FRONT.md)

> Frontend plan for BoilerSub, the Purdue-only sublease marketplace. This document defines the **core frontend only** (no Feature A–E UIs). It is designed to consume the backend API already specified in `PLAN2.md` (`/api/v1/...` with the `{ success, data | error }` envelope) and eventually merge into a single deployable product.

---

## 1. Overview

- **Stack** — Next.js 14 (App Router) + React + TypeScript + Tailwind CSS.
- **State** — React Context (or Zustand) for auth/session; local component state for forms.
- **API Layer** — Single `src/lib/apiClient.ts` module wrapping all backend calls with a configurable base URL, typed endpoint wrappers, and centralized `Authorization: Bearer <access_token>` header injection.
- **Routing** — File-based App Router (`app/` directory).
- **Design Source** — Existing drafted designs will be translated into Tailwind components.
- **Scope** — Auth flow (signup → email OTP → phone OTP → login), landing, browse, listing detail, create/edit listing, profile. No search, 3D previews, chat, chatbot, or swipe UI.

---

## 2. Global Layout & Shared Elements

- **Root Layout (`app/layout.tsx`)** — Wraps every page with the auth provider, global styles, toaster/notifications, and top nav.
- **Top Navigation Bar** — Persistent header across all authenticated pages.
  - **Elements**: BoilerSub logo (links `/`), `Browse` link (`/listings`), `List Your Sublease` button (`/listings/new`), `Profile` avatar dropdown (`My Profile`, `My Listings`, `Logout`).
  - **Unauthenticated state**: shows `Login` and `Sign Up` buttons instead of avatar.
- **Footer** — Simple footer with About / Terms / Contact links.
- **Toast/Notification System** — Global toaster for success/error feedback on API calls.
- **AuthProvider Context** — Holds `{ user, session, status }`; exposes `login`, `logout`, `refresh`, `isFullyVerified`.

---

## 3. Pages

### 3.1 Landing Page — `/`
- **Purpose**: Public marketing page introducing BoilerSub to Purdue students.
- **Elements**:
  - Hero section with tagline + two CTA buttons: `Sign Up with Purdue Email` → `/signup`, `Browse Listings` → `/listings`.
  - "How it works" three-step section (Sign Up → Verify → Browse/List).
  - Footer.
- **API calls**: None.

### 3.2 Sign Up — `/signup`
- **Purpose**: Start the multi-step verification flow.
- **Elements**:
  - Form fields: `email` (Purdue email), `password`, `confirm password`.
  - Inline validation: email must end in `@purdue.edu`; password ≥ 8 chars.
  - `Create Account` submit button.
  - Link: "Already have an account? Log in" → `/login`.
- **API call**: `POST /api/v1/auth/signup` with `{ email, password }`.
- **On success**: store pending email in session storage; redirect to `/verify-email`.

### 3.3 Email OTP Verification — `/verify-email`
- **Purpose**: Collect the 6-digit email OTP from the user's Purdue inbox.
- **Elements**:
  - 6-digit OTP input (one box per digit).
  - `Verify Email` submit button.
  - `Resend Code` button (disabled with a countdown after each send; rate-limited server-side).
  - Display the email the code was sent to.
- **API calls**:
  - `POST /api/v1/auth/verify-email` with `{ email, token }`.
  - `POST /api/v1/auth/resend-email-otp` with `{ email }`.
- **On success**: redirect to `/verify-phone`.

### 3.4 Phone Number Submission — `/verify-phone`
- **Purpose**: Collect the US `+1` phone number and trigger SMS OTP.
- **Elements**:
  - Phone input prefixed with `+1`, accepting 10 digits.
  - `Send Code` button.
  - Inline validation for `^\+1\d{10}$`.
- **API call**: `POST /api/v1/auth/phone/send-otp` with `{ phone }`.
- **On success**: reveal OTP input on the same page (or redirect to `/verify-phone/code`).

### 3.5 Phone OTP Verification — `/verify-phone/code`
- **Purpose**: Verify the SMS OTP to complete registration.
- **Elements**:
  - 6-digit OTP input.
  - `Verify Phone` submit button.
  - `Resend Code` button (countdown + rate-limited).
- **API calls**:
  - `POST /api/v1/auth/verify-phone` with `{ phone, token }`.
  - `POST /api/v1/auth/resend-phone-otp` with `{ phone }`.
- **On success**: store returned `session` in AuthProvider; redirect to `/listings`.

### 3.6 Login — `/login`
- **Purpose**: Returning-user login.
- **Elements**:
  - Form fields: `email`, `password`.
  - `Log In` submit button.
  - Link: "Don't have an account? Sign up" → `/signup`.
- **API call**: `POST /api/v1/auth/login` with `{ email, password }`.
- **On success**: store session; redirect to `/listings`.
- **On partial verification**: backend returns a pending state → route user to `/verify-email` or `/verify-phone` as appropriate.

### 3.7 Browse Listings — `/listings`
- **Purpose**: Main discovery surface; grid of all active listings (mock-seeded for now).
- **Elements**:
  - Page title "Available Subleases".
  - Grid of `ListingCard` components (thumbnail placeholder, title, price, dates, bedrooms, address).
  - Pagination controls (`Previous` / `Next` buttons; limit = 20 per page).
  - Empty state when no listings.
  - `List Your Sublease` CTA button (top-right).
- **API call**: `GET /api/v1/listings?limit=20&offset=<n>`.
- **Auth**: accessible to authenticated users.

### 3.8 Listing Detail — `/listings/[id]`
- **Purpose**: Full view of a single listing.
- **Elements**:
  - Photo placeholder area (mock for now).
  - Title, price, lease dates, bedrooms/bathrooms, address, amenities list, full description.
  - Owner mini-card (name, bio snippet) → links to `/users/[ownerId]`.
  - `Contact Lister` button — **disabled placeholder** (wired up in Feature C).
  - If current user is the owner: `Edit` and `Delete` buttons.
- **API call**: `GET /api/v1/listings/:id`.
- **Delete flow**: confirmation modal → `DELETE /api/v1/listings/:id` → redirect to `/listings`.

### 3.9 Create Listing — `/listings/new`
- **Purpose**: Allow a fully-verified user to publish a sublease.
- **Guard**: redirects to `/login` if unauthenticated; shows a "Complete verification" banner if not `fully_verified`.
- **Elements** (form fields):
  - `title` (text)
  - `description` (textarea)
  - `price` (number, USD/month)
  - `start_date` and `end_date` (date pickers)
  - `bedrooms` (number)
  - `bathrooms` (number)
  - `address` (text)
  - `amenities` (multi-select chips: WiFi, Parking, Laundry, Furnished, Pets, Gym, AC, Dishwasher)
  - `Publish Listing` submit button.
  - `Cancel` button → back to `/listings`.
- **API call**: `POST /api/v1/listings` with full body.
- **On success**: redirect to the new `/listings/[id]`.

### 3.10 Edit Listing — `/listings/[id]/edit`
- **Purpose**: Owner-only edit view of an existing listing.
- **Guard**: redirect if user is not the owner.
- **Elements**: same form as create, pre-populated with existing data; `Save Changes` and `Cancel` buttons.
- **API calls**:
  - `GET /api/v1/listings/:id` (load).
  - `PATCH /api/v1/listings/:id` (save).

### 3.11 My Profile — `/profile`
- **Purpose**: Current user's profile view + edit.
- **Elements**:
  - Avatar placeholder, full name, email (read-only), phone (read-only, masked), verification badges.
  - Editable fields: `full_name`, `bio`.
  - `Save Changes` button.
  - Link: `My Listings` → `/profile/listings`.
  - `Log Out` button.
- **API calls**:
  - `GET /api/v1/auth/me`.
  - `PATCH /api/v1/users/me` with `{ full_name, bio }`.

### 3.12 Public User Profile — `/users/[id]`
- **Purpose**: View another user's public profile (linked from listing detail).
- **Elements**: name, bio, verification badges, list of their active listings.
- **API calls**:
  - `GET /api/v1/users/:id`.
  - `GET /api/v1/listings?owner_id=:id` (filter to be added later if not present).

### 3.13 My Listings — `/profile/listings`
- **Purpose**: Current user's own listings management page.
- **Elements**:
  - List of the user's listings with inline `Edit` and `Delete` buttons on each row.
  - `Create New Listing` button.
  - Empty state with CTA if none exist.
- **API calls**:
  - `GET /api/v1/listings?owner_id=me` (or client-side filter until backend supports it).
  - `DELETE /api/v1/listings/:id` on delete action.

### 3.14 404 / Not Found
- Generic 404 page with a link back to `/listings`.

---

## 4. Shared Components

- **`<Button>`** — variants: `primary`, `secondary`, `ghost`, `danger`.
- **`<Input>` / `<Textarea>` / `<DatePicker>` / `<NumberInput>`** — form primitives with error state.
- **`<OtpInput>`** — 6-digit code input used on both verification pages.
- **`<ListingCard>`** — reusable card used on `/listings`, `/profile/listings`, `/users/[id]`.
- **`<AmenityChip>`** — toggleable chip for the create/edit form.
- **`<Modal>`** — confirmation modal (used for delete).
- **`<Toast>`** — success/error notifications tied to the global toaster.
- **`<VerificationBadge>`** — small badge shown next to names when `fully_verified`.
- **`<ProtectedRoute>`** — HOC/wrapper redirecting unauthenticated users to `/login`.

---

## 5. API Client (`src/lib/apiClient.ts`)

- Single module that every page imports. Holds:
  - `BASE_URL` from `process.env.NEXT_PUBLIC_API_BASE_URL` (defaults to `http://localhost:4000/api/v1`).
  - `request<T>()` wrapper injecting `Authorization` header, parsing the `{ success, data, error }` envelope, and throwing a typed `ApiError` on failure.
  - Typed endpoint wrappers:
    - `auth.signup`, `auth.verifyEmail`, `auth.sendPhoneOtp`, `auth.verifyPhone`, `auth.login`, `auth.logout`, `auth.me`, `auth.resendEmailOtp`, `auth.resendPhoneOtp`.
    - `users.getById`, `users.updateMe`.
    - `listings.list`, `listings.getById`, `listings.create`, `listings.update`, `listings.delete`.
- Versioning or base-URL swaps are a **one-line change** in this file.

---

## 6. Auth Flow Handling

- **Session storage**: Supabase access/refresh tokens persisted in `localStorage` (or `httpOnly` cookie if backend is expanded to proxy). Rehydrated by `AuthProvider` on app load.
- **Route guards**:
  - Public: `/`, `/login`, `/signup`, `/verify-email`, `/verify-phone`, `/verify-phone/code`.
  - Authenticated (any verification state): `/profile`, `/verify-*`.
  - Fully verified only: `/listings/new`, `/listings/[id]/edit`.
- **401 handling**: API client intercepts 401 → clears session → redirects to `/login`.
- **Verification routing**: if `/auth/me` returns `fully_verified: false`, global guard routes to the appropriate pending step.

---

## 7. Project Structure (Next.js App Router)

```
boilersub-frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                     # Landing
│   ├── signup/page.tsx
│   ├── login/page.tsx
│   ├── verify-email/page.tsx
│   ├── verify-phone/
│   │   ├── page.tsx
│   │   └── code/page.tsx
│   ├── listings/
│   │   ├── page.tsx                 # Browse
│   │   ├── new/page.tsx             # Create
│   │   └── [id]/
│   │       ├── page.tsx             # Detail
│   │       └── edit/page.tsx
│   ├── profile/
│   │   ├── page.tsx
│   │   └── listings/page.tsx
│   ├── users/[id]/page.tsx
│   └── not-found.tsx
├── src/
│   ├── components/                  # Shared UI
│   ├── lib/
│   │   ├── apiClient.ts
│   │   └── validators.ts
│   ├── context/
│   │   └── AuthProvider.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   └── useListings.ts
│   └── types/
│       └── index.ts
├── public/
├── tailwind.config.ts
├── next.config.js
└── package.json
```

---

## 8. Environment Configuration

```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000/api/v1
```

- Single env var for the backend base URL; swap for production without touching any component.

---

## 9. Success Criteria

- **Auth** — A new user can sign up, verify email OTP, verify phone OTP, and log in entirely through the UI against the live backend.
- **CRUD** — A verified user can browse listings, view details, create, edit, and delete their own listings.
- **Profile** — Users can view and edit their profile, and view other users' public profiles.
- **Decoupling** — All API calls flow through `apiClient.ts`; swapping base URL or API version is a single-file change.
- **Feature-ready** — Page layout and component structure leave clean slots where Features A–E (search bar, 3D viewer, chat widget, chatbot, swipe deck) will drop in later.

---

## 10. Open Questions

1. Use **Zustand** or **React Context** for auth state?
2. Should tokens be stored in `localStorage` (simpler) or `httpOnly` cookies via a Next.js API proxy (more secure)?
3. Confirm the exact Tailwind design tokens (colors/spacing) from the existing draft designs.
4. Should `/listings?owner_id=...` filter be added to the backend now, or should `My Listings` filter client-side?

---

*This PRD defines the complete core frontend, designed to merge directly with the backend specified in `PLAN2.md` via a single versioned API client.*

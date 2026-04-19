# BoilerSub Open Source

BoilerSub is a Purdue-exclusive subleasing marketplace designed to simplify the housing search for students. This repository contains the integrated Next.js application, combining a high-performance frontend with a robust Supabase-backed backend.

## 🚀 Features

- **Purdue-Only Authentication:** Secure signup and login restricted to `@purdue.edu` email addresses.
- **Integrated Marketplace:** Browse, create, and manage sublease listings in a single unified project.
- **Verification Flow:** Multi-step verification including email OTP and phone SMS (optional) to ensure community trust.
- **Real-time Infrastructure:** Built on Supabase for instant updates and reliable data management.
- **Modern Tech Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, and Supabase.

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, React, Tailwind CSS
- **Backend:** Next.js API Routes, Supabase (Auth, Database, Storage)
- **Database:** PostgreSQL (via Supabase)
- **Deployment:** Vercel

## 🏁 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Supabase account

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shah1123-coder/BoilerSub-opensource.git
   cd BoilerSub-opensource
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the root directory with the following:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## 📄 License

This project is open-source and available under the MIT License.

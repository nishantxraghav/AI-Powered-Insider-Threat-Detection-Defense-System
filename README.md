# ThreatWatch — Insider Threat Detection Dashboard

A production-ready cybersecurity dashboard built with React, Supabase, Recharts, and Framer Motion.

## Tech Stack
- **React 18** + Vite
- **Tailwind CSS** (dark/cyber theme)
- **Supabase** (Auth + PostgreSQL + Realtime)
- **Recharts** (charts)
- **Framer Motion** (animations)
- **React Router v6** (routing)
- **React Hot Toast** (notifications)

## Quick Start

### 1. Clone & Install
```bash
npm install
```

### 2. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your **Project URL** and **anon/public key** from Settings → API

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env and fill in your Supabase credentials
```

### 4. Set Up Database
1. Open your Supabase project → SQL Editor
2. Copy and paste the entire contents of `supabase-schema.sql`
3. Click **Run** — this creates all tables, RLS policies, enables Realtime, and seeds mock data

### 5. Run the App
```bash
npm run dev
```

### 6. Create Your Account
- Go to `http://localhost:5173/signup`
- Create an account with any email/password
- (Or use Supabase Auth → Users to invite users)

## Features

| Feature | Description |
|---------|-------------|
| 🔐 Auth | Supabase email/password with protected routes |
| 📊 Dashboard | Live metrics, charts, activity feed from Supabase |
| 👤 User Profiles | Risk scores, behavior timelines, anomaly radar |
| 🚨 Alert Center | Full alert table with modal details + status updates |
| 📡 Live Monitor | Realtime Supabase subscriptions, live score streams |
| 🎭 Scenarios | 5 CERT threat scenarios with indicators & mitigations |
| 🧠 Model Insights | Ensemble weights, feature importance, PCA visualization |

## Project Structure
```
src/
├── components/
│   ├── layout/     # Sidebar, AppLayout, ProtectedRoute
│   └── ui/         # Reusable UI components
├── hooks/
│   ├── useAuth.jsx      # Auth context + Supabase auth
│   └── useRealtime.js   # Supabase realtime subscriptions
├── lib/
│   └── supabase.js      # Supabase client
├── pages/               # All route pages
├── services/
│   └── db.js            # All Supabase DB queries
└── types/               # TypeScript-ready type definitions
```

## Realtime Setup
The app subscribes to `alerts` and `anomalies` tables via Supabase Realtime.
To test it: use the **"Inject Event"** button on the Live Monitor page — it inserts a real record into Supabase which triggers the subscription and shows a toast notification.

## Supabase Tables
- `users` — monitored operator profiles with risk scores
- `activities` — logon/file/email/web/usb events
- `alerts` — threat detections with severity + status
- `anomalies` — statistical deviation events
- `scenarios` — threat playbooks

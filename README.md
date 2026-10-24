# Reelz 🎬

A fully functional TikTok-inspired short-video social platform built with React, TypeScript, Tailwind CSS, and Supabase.

---

## Features

- **Full-screen vertical video feed** — snap-scrolling, 9:16 aspect ratio
- **Autoplay & Intersection Observer** — plays only the visible video
- **Double-tap to like** — animated heart burst
- **Like, comment, follow, share** — all interactive in demo mode
- **Comments drawer** — real-time comments with auth check
- **Search & Discover** — search users, captions, hashtags + trending topics
- **Video upload** — drag-and-drop with progress, validation, hashtags
- **User profiles** — stats, video grid, edit profile
- **Auth** — Supabase email/password + demo mode (no backend required)
- **Responsive** — mobile-first with desktop sidebar layout
- **Demo mode** — works without any backend configuration

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Konfigurasi database

Edit `.env.local` — credentials Neon sudah ada di sana:

```env
DATABASE_URL=postgresql://neondb_owner:...@...neon.tech/neondb?sslmode=require
JWT_SECRET=ganti-dengan-string-random-panjang-di-production
PORT=3001
```

### 3. Jalankan app (frontend + API server bersamaan)

```bash
npm run dev
```

Ini menjalankan dua proses sekaligus:
- **API server** (Hono + Neon) di `http://localhost:3001`
- **React frontend** (Vite) di `http://localhost:5173`

Vite otomatis proxy `/api/*` ke server, jadi tidak ada CORS issue.

### Atau jalankan terpisah

```bash
# Terminal 1 — API server
npm run server

# Terminal 2 — Frontend
npx vite
```

---

## Supabase Setup

### Step 1 — Create a project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Create a new project
3. Copy the **Project URL** and **anon public key** from Project Settings → API

### Step 2 — Run migrations

In Supabase Dashboard → **SQL Editor**, paste and run the contents of:

```
supabase/migrations/001_initial_schema.sql
```

This creates all tables, indexes, triggers, and RLS policies.

### Step 3 — Create storage bucket

In the SQL Editor, also run:

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Anyone can view videos" ON storage.objects
  FOR SELECT USING (bucket_id = 'videos');

CREATE POLICY "Authenticated users can upload videos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');
```

---

## Environment Variables

| Variable                 | Description                         |
|--------------------------|-------------------------------------|
| `VITE_SUPABASE_URL`      | Your Supabase project URL           |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon/public key       |

Leave both empty to use **Demo Mode**.

---

## Project Structure

```
src/
├── components/
│   ├── comments/    # CommentsDrawer
│   ├── layout/      # AppLayout, Sidebar, BottomNav
│   ├── ui/          # Avatar, Modal, Skeleton
│   └── video/       # VideoFeed, VideoCard, VideoPlayer, VideoActions, VideoInfo
├── contexts/
│   └── AuthContext.tsx
├── hooks/
│   └── useVideos.ts
├── lib/
│   ├── supabase.ts  # Supabase client + types
│   └── demo-data.ts # Sample data for demo mode
└── pages/
    ├── HomePage.tsx
    ├── DiscoverPage.tsx
    ├── ProfilePage.tsx
    ├── AuthPage.tsx
    ├── UploadPage.tsx
    ├── InboxPage.tsx
    └── EditProfilePage.tsx
```

---

## Tech Stack

| Technology        | Purpose                    |
|-------------------|----------------------------|
| React 18          | UI framework               |
| TypeScript        | Type safety                |
| Vite              | Build tool                 |
| Tailwind CSS 3    | Styling                    |
| Lucide React      | Icons                      |
| React Router v6   | Client-side routing        |
| Supabase          | Auth, database, storage    |

---

## Demo Mode

When Supabase is not configured, the app runs in Demo Mode:

- 6 sample videos from royalty-free CDNs (Mixkit)
- 5 fictional creator profiles
- Fully interactive likes, follows, comments (in-memory)
- Auth works with "Continue as Demo User"
- Upload simulates progress but doesn't persist

---

## Build for Production

```bash
npm run build
npm run preview
```

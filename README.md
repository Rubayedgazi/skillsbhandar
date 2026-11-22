# SkillsBhandar

Premium library of AI Skills. Two apps, one Supabase backend.

Live: https://skillsbhandar.vercel.app (public) and https://skillsbhandar-admin.vercel.app (admin).

- **Public library** — `apps/web` — deploys to Vercel as `skillsbhandar`
  (`skillsbhandar.vercel.app`). Bengali UI, brand name stays English.
- **Admin** — `apps/admin` — deploys to Vercel as `skillsbhandar-admin`
  (`skillsbhandar-admin.vercel.app`). Admin-only, locked sign-in, no public pages.
- **Shared code** — `packages/shared` — types, Supabase client, permissions,
  AI Skill Finder logic, the 8 main categories.
- **Database** — `supabase/migrations/001_init.sql` — run it once in the
  Supabase SQL Editor (project `skillsbhandar`). It creates all tables,
  enables RLS, and inserts the 8 main categories. The library starts at
  zero: 0 skills, 0 tutorials, 0 downloads.

## Brand

SkillsBhandar. 

Design: almost-black background `#08080f`, charcoal surfaces, white text,
muted grey secondary text, purple accent gradient `#7c5cff → #5b8cff`.

## Setup (plain language)

1. In Supabase, open the `skillsbhandar` project, open the SQL Editor,
   paste `supabase/migrations/001_init.sql`, click Run. Then run
   `002_grants.sql` and `003_owner_profile.sql` the same way (003 fixes
   the Admin login — without it the owner profile cannot be created).
2. In Supabase, Project Settings → API, copy the Project URL and the
   anon public key. In Authentication → Providers → Email, turn OFF
   "Confirm email" (or the owner setup will need an email confirmation).
3. In Vercel, create two projects from the same GitHub repo
   (`skillsbhandar`): one with Root Directory `apps/web`, one with
   Root Directory `apps/admin`. Set env vars in both:
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   In the admin project only, also set `SUPABASE_SERVICE_ROLE_KEY`
   (needed for owner setup, member creation and Admin reset).
   Redeploy after adding env vars — the homepage is cached for 60s.
4. Deploy. Both sites read the same Supabase project, so an admin
   change appears on the public site within a minute.

## Speed & devices

- The public homepage is cached for 60 seconds (`revalidate = 60`) and
  fetches each table once per request, so it no longer waits for
  Supabase on every visit. Vercel functions run in Singapore (`sin1`,
  see `apps/web/vercel.json` and `apps/admin/vercel.json`).
- The site works on phone (360px), tablet (768px), laptop and desktop:
  the sidebar becomes a hamburger menu on mobile, the category grid is
  1 column on a phone, 2 on a tablet and 4 on desktop, tables scroll
  sideways on small screens, and buttons are at least 44px tall.

## Owner account

Owner email is `owner@skillsbhandar.com`. The first sign-in in Admin
shows a one-time "Set your owner password" form (minimum 8 characters,
typed twice). After that, empty or wrong passwords are rejected, and
the setup form never appears again. Member accounts are refused at
admin sign-in. Only the owner can grant the Sub-Admins permission.

If the owner cannot log in: on the Admin sign-in screen use
"পাসওয়ার্ড ভুলে গেছেন?" (reset link by email) or "অ্যাডমিন রিসেট
করুন" (deletes only the owner login, then set a new password — skills
and members are kept). Both need `SUPABASE_SERVICE_ROLE_KEY` set in
Vercel for the one-click server version; without it the screen shows
exactly what to do in Supabase instead.

## Local development

```bash
npm install
cp .env.example apps/web/.env.local   # fill in your keys
cp .env.example apps/admin/.env.local # fill in your keys
npm run dev:web    # http://localhost:3000
npm run dev:admin  # http://localhost:3001
```

## Build

```bash
npm run build:web
npm run build:admin
```

## What is NOT in this build yet

- Payments / subscriptions (future, after launch).
- File uploads go through the `skill-files` private Storage bucket;
  the bucket must be created in Supabase Storage (see
  `supabase/migrations/001_init.sql` notes) before uploading files.
- Email sending for password resets needs Supabase Auth email
  templates configured in the Supabase dashboard.

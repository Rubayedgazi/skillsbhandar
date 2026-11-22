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
   paste `supabase/migrations/001_init.sql`, click Run.
2. In Supabase, Project Settings → API, copy the Project URL and the
   anon public key.
3. In Vercel, create two projects from the same GitHub repo
   (`skillsbhandar`): one with Root Directory `apps/web`, one with
   Root Directory `apps/admin`. Set env vars in both:
   `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   In the admin project only, also set `SUPABASE_SERVICE_ROLE_KEY`
   (needed to create member accounts and for the owner reset).
4. Deploy. Both sites read the same Supabase project, so an admin
   change appears on the public site immediately.

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

## Owner account

Owner email is `owner@skillsbhandar.com`. The first sign-in in Admin
shows a one-time "Set your owner password" form (minimum 8 characters,
typed twice). After that, empty or wrong passwords are rejected, and
the setup form never appears again. Member accounts are refused at
admin sign-in. Only the owner can grant the Sub-Admins permission.

## What is NOT in this build yet

- Payments / subscriptions (future, after launch).
- File uploads go through the `skill-files` private Storage bucket;
  the bucket must be created in Supabase Storage (see
  `supabase/migrations/001_init.sql` notes) before uploading files.
- Email sending for password resets needs Supabase Auth email
  templates configured in the Supabase dashboard.

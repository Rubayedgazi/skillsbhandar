# Supabase setup for SkillsBhandar

Project: `skillsbhandar` — https://cjkesuieksldzgpefujw.supabase.co

1. Open the project in Supabase, open the **SQL Editor**, paste
   `migrations/001_init.sql`, click **Run**. It creates all tables, RLS
   policies, and the 8 main categories. The library starts at zero.
2. Run `migrations/002_grants.sql` the same way (anon read access).
3. Run `migrations/003_owner_profile.sql` the same way. **This one fixes
   the Admin login**: it lets a user create their own profile row, lets
   staff read all profiles, and lets staff write site settings, skill
   steps, activity logs, etc. Without it the owner setup fails silently.
4. In **Storage**, create two buckets: `skill-files` (private) and
   `public-images` (public).
5. In **Authentication → Providers → Email**, turn OFF "Confirm email"
   (or the owner one-time password setup will ask the owner to confirm
   by email first). The owner account is `owner@skillsbhandar.com`.
6. Copy the Project URL and anon public key from **Project Settings → API**
   into the Vercel env vars for both apps. In the **Admin** project only,
   also add `SUPABASE_SERVICE_ROLE_KEY` (from the same API page — the
   `service_role` key, never in code, only in Vercel). Without it, member
   creation, owner setup and Admin reset return a clear 501 message
   instead of working. Redeploy after adding it.

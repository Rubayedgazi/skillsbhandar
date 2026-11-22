# Supabase setup for SkillsBhandar

Project: `skillsbhandar` — https://cjkesuieksldzgpefujw.supabase.co

1. Open the project in Supabase, open the **SQL Editor**, paste
   `migrations/001_init.sql`, click **Run**. It creates all tables, RLS
   policies, and the 8 main categories. The library starts at zero.
2. In **Storage**, create two buckets: `skill-files` (private) and
   `public-images` (public).
3. In **Authentication → Settings**, turn OFF email confirmation
   (or the owner one-time password setup will ask the owner to confirm
   by email first). The owner account is `owner@skillsbhandar.com`.
4. Copy the Project URL and anon public key from **Project Settings → API**
   into the Vercel env vars for both apps.

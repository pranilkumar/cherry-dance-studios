-- ════════════════════════════════════════════════════════════════════
-- Cherry Dance Studios — Parent Portal migration
-- Adds parent_profiles table + auto-create trigger so every signed-in
-- Supabase Auth user gets a profile row.
--
-- HOW TO RUN:
--   1. Open Supabase → SQL Editor
--   2. Paste this entire file
--   3. Click "Run"
--
-- Idempotent: safe to re-run.
-- ════════════════════════════════════════════════════════════════════

-- ─── 1. Table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS parent_profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text NOT NULL,
  display_name  text,
  phone         text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS parent_profiles_email_idx ON parent_profiles(email);

COMMENT ON TABLE parent_profiles IS
  'One row per authenticated parent. Linked 1:1 to auth.users.';

-- ─── 2. Auto-create profile on user signup ────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.parent_profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ─── 3. updated_at maintenance ────────────────────────────────────
-- (The set_updated_at() function was created by the workshops migration.
--  If you haven't run that, uncomment the function block below.)
--
-- CREATE OR REPLACE FUNCTION set_updated_at()
-- RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END;
-- $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS parent_profiles_set_updated_at ON parent_profiles;
CREATE TRIGGER parent_profiles_set_updated_at
  BEFORE UPDATE ON parent_profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─── 4. RLS ───────────────────────────────────────────────────────
ALTER TABLE parent_profiles ENABLE ROW LEVEL SECURITY;

-- Parents can SELECT their own profile
DROP POLICY IF EXISTS pp_read_own ON parent_profiles;
CREATE POLICY pp_read_own ON parent_profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Parents can UPDATE their own profile
DROP POLICY IF EXISTS pp_update_own ON parent_profiles;
CREATE POLICY pp_update_own ON parent_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- Anon (admin) full access — matches existing admin pattern
DROP POLICY IF EXISTS pp_anon_all ON parent_profiles;
CREATE POLICY pp_anon_all ON parent_profiles
  FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

-- ─── 5. Verification ──────────────────────────────────────────────
-- Should show 1 table + 3 policies:
--   SELECT tablename, policyname FROM pg_policies WHERE tablename = 'parent_profiles';

-- ─── 6. Supabase Auth settings you also need to set in the dashboard ─
-- Project Settings → Authentication → URL Configuration
--   Site URL:             http://localhost:3000   (dev) or your prod URL
--   Redirect URLs (add):  http://localhost:3000/portal/auth/callback
--                         https://YOUR-PROD-DOMAIN/portal/auth/callback
--
-- Project Settings → Authentication → Email Templates
--   The default "Magic Link" template is fine to start. Customise later.

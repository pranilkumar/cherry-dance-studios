-- ════════════════════════════════════════════════════════════════════
-- Cherry Dance Studios — workshops module: relax RLS for admin CRUD
--
-- Why this exists:
--   The existing admin portal uses localStorage as the auth gate and
--   talks to Supabase with the anon key (same as the public site).
--   That means policies like "authenticated full access" don't match —
--   the admin acts as anon. To let the admin manage workshops, we
--   loosen RLS on workshops + workshop_bookings to allow anon CRUD,
--   matching how `registrations` and other tables work today.
--
--   SECURITY NOTE: This is the same security level as the rest of the
--   admin (i.e. relying on the localStorage gate, not on Supabase). It's
--   not ideal long-term. When you migrate the admin to real Supabase
--   Auth, revert these policies to "authenticated only" and the system
--   will be properly secure.
--
-- Idempotent: re-running is safe.
-- ════════════════════════════════════════════════════════════════════

-- ─── workshops ────────────────────────────────────────────────────
-- Anon needs to see ALL workshops (including drafts) to manage them.
-- Replace the public-read-only-published policy with permissive read.

DROP POLICY IF EXISTS workshops_public_read ON workshops;
DROP POLICY IF EXISTS workshops_admin_all   ON workshops;
DROP POLICY IF EXISTS workshops_anon_read   ON workshops;
DROP POLICY IF EXISTS workshops_anon_write  ON workshops;

-- Read: anyone can read any workshop row (the homepage filters by status
-- in the query; admin needs to see everything including drafts).
CREATE POLICY workshops_anon_read ON workshops
  FOR SELECT TO anon, authenticated
  USING (true);

-- Write: anon can insert / update / delete. Matches the existing pattern.
CREATE POLICY workshops_anon_write ON workshops
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);


-- ─── workshop_bookings ────────────────────────────────────────────
-- Anon needs SELECT (to list bookings in admin), UPDATE (mark paid,
-- check in), DELETE (cancel). Public still keeps INSERT for parent
-- registration from the public site.

DROP POLICY IF EXISTS wb_public_insert ON workshop_bookings;
DROP POLICY IF EXISTS wb_admin_all     ON workshop_bookings;
DROP POLICY IF EXISTS wb_anon_read     ON workshop_bookings;
DROP POLICY IF EXISTS wb_anon_write    ON workshop_bookings;

CREATE POLICY wb_anon_read ON workshop_bookings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY wb_anon_write ON workshop_bookings
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);


-- ─── workshop_waitlist ────────────────────────────────────────────

DROP POLICY IF EXISTS wwl_public_insert ON workshop_waitlist;
DROP POLICY IF EXISTS wwl_admin_all     ON workshop_waitlist;
DROP POLICY IF EXISTS wwl_anon_read     ON workshop_waitlist;
DROP POLICY IF EXISTS wwl_anon_write    ON workshop_waitlist;

CREATE POLICY wwl_anon_read ON workshop_waitlist
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY wwl_anon_write ON workshop_waitlist
  FOR ALL TO anon, authenticated
  USING (true)
  WITH CHECK (true);


-- Verification:
--   SELECT tablename, policyname FROM pg_policies
--   WHERE tablename IN ('workshops','workshop_bookings','workshop_waitlist')
--   ORDER BY tablename, policyname;

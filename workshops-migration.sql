-- ════════════════════════════════════════════════════════════════════
-- Cherry Dance Studios — Workshops module
-- Migration v1.1 — uses `workshop_bookings` (not `workshop_registrations`)
-- to avoid colliding with the legacy MnM table.
--
-- HOW TO RUN:
--   1. Open your Supabase project → SQL Editor
--   2. Paste this entire file
--   3. Click "Run"
--   4. Verify with the queries at the bottom (uncomment to run)
--
-- This script is idempotent — safe to run multiple times.
-- It does NOT touch the existing `workshop_registrations` table; that one
-- stays as legacy MnM data.
-- ════════════════════════════════════════════════════════════════════

-- ────────────────────────────────────────────────────────────────────
-- 1. Extensions
-- ────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ════════════════════════════════════════════════════════════════════
-- 2. TABLES
-- ════════════════════════════════════════════════════════════════════

-- ─── workshops ────────────────────────────────────────────────
-- Canonical workshop catalog. Each row is one workshop event.
CREATE TABLE IF NOT EXISTS workshops (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text UNIQUE NOT NULL,
  title             text NOT NULL,
  subtitle          text,
  description       text,
  cover_image_url   text,
  starts_at         timestamptz NOT NULL,
  ends_at           timestamptz,
  venue_name        text DEFAULT 'Cherry Dance Studios',
  venue_address     text DEFAULT 'Barrhaven, Ottawa, ON',
  instructor_names  text[] DEFAULT ARRAY[]::text[],
  capacity          int  DEFAULT 0,                       -- 0 = unlimited
  registered_count  int  DEFAULT 0,                       -- auto-maintained
  waitlist_enabled  bool DEFAULT false,
  status            text NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','published','sold_out','completed','cancelled')),
  featured          bool DEFAULT false,
  packages          jsonb DEFAULT '[]'::jsonb,            -- [{id,label,price_cents,desc}]
  perks             text[] DEFAULT ARRAY[]::text[],
  payment_info      text DEFAULT 'E-transfer to cherrydancestudio.cds@gmail.com',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);


-- ─── workshop_bookings ────────────────────────────────────────
-- One row per parent registration. Children stored as JSONB for flexibility.
-- (Renamed from workshop_registrations to avoid colliding with the legacy
--  MnM-only table that already exists.)
CREATE TABLE IF NOT EXISTS workshop_bookings (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id     uuid NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  package_id      text,
  package_label   text,
  amount_cents    int,
  parent_name     text NOT NULL,
  parent_email    text NOT NULL,
  parent_phone    text NOT NULL,
  children        jsonb DEFAULT '[]'::jsonb,              -- [{name, age}]
  dietary_notes   text,
  heard_from      text,
  payment_status  text NOT NULL DEFAULT 'pending'
                  CHECK (payment_status IN ('pending','paid','cancelled','refunded')),
  qr_token        uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  checked_in_at   timestamptz,
  admin_notes     text,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);


-- ─── workshop_waitlist ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS workshop_waitlist (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workshop_id     uuid NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  parent_name     text NOT NULL,
  parent_email    text NOT NULL,
  parent_phone    text NOT NULL,
  children_count  int DEFAULT 1,
  notified_at     timestamptz,
  created_at      timestamptz DEFAULT now()
);


-- ════════════════════════════════════════════════════════════════════
-- 3. INDEXES
-- ════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS workshops_status_starts_idx
  ON workshops(status, starts_at);

CREATE INDEX IF NOT EXISTS workshops_featured_idx
  ON workshops(featured) WHERE featured = true;

CREATE INDEX IF NOT EXISTS workshop_bookings_workshop_idx
  ON workshop_bookings(workshop_id);

CREATE INDEX IF NOT EXISTS workshop_bookings_email_idx
  ON workshop_bookings(parent_email);

CREATE INDEX IF NOT EXISTS workshop_bookings_status_idx
  ON workshop_bookings(payment_status);

CREATE INDEX IF NOT EXISTS workshop_waitlist_workshop_idx
  ON workshop_waitlist(workshop_id);


-- ════════════════════════════════════════════════════════════════════
-- 4. TRIGGERS
-- ════════════════════════════════════════════════════════════════════

-- ─── updated_at auto-bump ─────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workshops_set_updated_at ON workshops;
CREATE TRIGGER workshops_set_updated_at
  BEFORE UPDATE ON workshops
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS workshop_bookings_set_updated_at ON workshop_bookings;
CREATE TRIGGER workshop_bookings_set_updated_at
  BEFORE UPDATE ON workshop_bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ─── workshops.registered_count auto-maintenance ──────────────
-- Recomputes the count on the parent workshop whenever a booking is
-- inserted, updated, or deleted. Cancelled bookings are excluded.
-- Also auto-flips status from 'published' → 'sold_out' when capacity hits.
CREATE OR REPLACE FUNCTION update_workshop_registered_count()
RETURNS TRIGGER AS $$
DECLARE
  target_workshop uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_workshop := OLD.workshop_id;
  ELSE
    target_workshop := NEW.workshop_id;
  END IF;

  UPDATE workshops
     SET registered_count = (
       SELECT COUNT(*)::int
       FROM workshop_bookings
       WHERE workshop_id = target_workshop
         AND payment_status <> 'cancelled'
     )
   WHERE id = target_workshop;

  UPDATE workshops
     SET status = 'sold_out'
   WHERE id = target_workshop
     AND status = 'published'
     AND capacity > 0
     AND registered_count >= capacity;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS workshop_bookings_update_count ON workshop_bookings;
CREATE TRIGGER workshop_bookings_update_count
  AFTER INSERT OR UPDATE OR DELETE ON workshop_bookings
  FOR EACH ROW EXECUTE FUNCTION update_workshop_registered_count();


-- ════════════════════════════════════════════════════════════════════
-- 5. ROW LEVEL SECURITY
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE workshops          ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_bookings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE workshop_waitlist  ENABLE ROW LEVEL SECURITY;

-- ─── workshops ────────────────────────────────────────────────
-- Public reads: only published / sold_out / completed (no drafts, no cancelled)
DROP POLICY IF EXISTS workshops_public_read ON workshops;
CREATE POLICY workshops_public_read ON workshops
  FOR SELECT
  TO anon, authenticated
  USING (status IN ('published', 'sold_out', 'completed'));

-- Admins (any signed-in Supabase user) full access
DROP POLICY IF EXISTS workshops_admin_all ON workshops;
CREATE POLICY workshops_admin_all ON workshops
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ─── workshop_bookings ────────────────────────────────────────
-- Anyone can register (insert their own row)
DROP POLICY IF EXISTS wb_public_insert ON workshop_bookings;
CREATE POLICY wb_public_insert ON workshop_bookings
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Admins full access
DROP POLICY IF EXISTS wb_admin_all ON workshop_bookings;
CREATE POLICY wb_admin_all ON workshop_bookings
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- NOTE: the QR ticket page fetches by qr_token via a Next.js server route
-- using the service role, so anon SELECT is intentionally not granted.

-- ─── workshop_waitlist ────────────────────────────────────────
DROP POLICY IF EXISTS wwl_public_insert ON workshop_waitlist;
CREATE POLICY wwl_public_insert ON workshop_waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS wwl_admin_all ON workshop_waitlist;
CREATE POLICY wwl_admin_all ON workshop_waitlist
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);


-- ════════════════════════════════════════════════════════════════════
-- 6. VERIFICATION QUERIES — uncomment one line at a time to run
-- ════════════════════════════════════════════════════════════════════

-- Three new tables should appear (plus the legacy workshop_registrations):
--   SELECT table_name FROM information_schema.tables
--   WHERE table_schema = 'public' AND table_name LIKE 'workshop%'
--   ORDER BY table_name;

-- All three new tables should have rowsecurity = true:
--   SELECT relname, relrowsecurity FROM pg_class
--   WHERE relname IN ('workshops','workshop_bookings','workshop_waitlist');

-- Six policies should be listed (2 per table):
--   SELECT tablename, policyname FROM pg_policies
--   WHERE tablename IN ('workshops','workshop_bookings','workshop_waitlist')
--   ORDER BY tablename, policyname;


-- ════════════════════════════════════════════════════════════════════
-- 7. (OPTIONAL) SEED DATA — uncomment to insert two example workshops
-- ════════════════════════════════════════════════════════════════════

-- INSERT INTO workshops (slug, title, subtitle, description, starts_at, ends_at,
--   instructor_names, capacity, waitlist_enabled, status, featured, packages, perks)
-- VALUES
-- (
--   'bollywood-summer-2026',
--   'Bollywood Summer Camp',
--   'A 3-day intensive for ages 8+',
--   'Three days of Bollywood drills, classic routines, and a final showcase for parents.',
--   '2026-07-15 14:00:00+00',
--   '2026-07-17 20:00:00+00',
--   ARRAY['Cherry','Pranil'],
--   20, true, 'published', true,
--   '[
--     {"id":"single","label":"Single day","price_cents":4500,"desc":"One day drop-in"},
--     {"id":"full","label":"All three days","price_cents":12000,"desc":"Full camp + showcase"}
--   ]'::jsonb,
--   ARRAY['Snacks included','Final showcase','Take-home video']
-- ),
-- (
--   'mom-and-me-fall-2026',
--   'Mom & Me — Fall Edition',
--   'Celebrate the bond through dance',
--   'A 2-hour Mothers-Day-style workshop for parents and kids ages 4+.',
--   '2026-10-12 22:00:00+00',
--   '2026-10-13 00:00:00+00',
--   ARRAY['Cherry'],
--   30, false, 'published', false,
--   '[
--     {"id":"mom_1kid","label":"Mom + 1 child","price_cents":2500,"desc":"One mom, one dancer"},
--     {"id":"mom_2kids","label":"Mom + 2 children","price_cents":3000,"desc":"Double the fun"}
--   ]'::jsonb,
--   ARRAY['Video recording included','Snacks included']
-- );


-- ════════════════════════════════════════════════════════════════════
-- END OF MIGRATION
-- ════════════════════════════════════════════════════════════════════

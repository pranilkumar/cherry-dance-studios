-- ════════════════════════════════════════════════════════════════════
-- Cherry Dance Studios — registrations table enhancement
-- Adds 4 columns the new Register form needs.
--
-- HOW TO RUN:
--   1. Open Supabase → SQL Editor
--   2. Paste this entire file
--   3. Click "Run"
--
-- Idempotent: re-running it is safe (each ALTER uses IF NOT EXISTS).
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS allergies          text,
  ADD COLUMN IF NOT EXISTS emergency_contact  text,
  ADD COLUMN IF NOT EXISTS photo_consent      boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS heard_from         text;

COMMENT ON COLUMN registrations.allergies         IS 'Dietary + medical notes (allergies, conditions instructor should know).';
COMMENT ON COLUMN registrations.emergency_contact IS 'Optional alternate contact if primary parent is unreachable.';
COMMENT ON COLUMN registrations.photo_consent     IS 'Permission to use dancer''s photo/video in studio media.';
COMMENT ON COLUMN registrations.heard_from        IS 'How the family found the studio (Instagram / friend / etc).';

-- Verification (uncomment one line):
-- SELECT column_name, data_type, column_default FROM information_schema.columns
--   WHERE table_name = 'registrations' ORDER BY ordinal_position;

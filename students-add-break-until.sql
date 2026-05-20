-- ════════════════════════════════════════════════════════════════════
-- Cherry Dance Studios — students.break_until
-- Tracks when an on-break student is expected back.
--
-- HOW TO RUN:
--   1. Open Supabase → SQL Editor
--   2. Paste this file
--   3. Click "Run"
--
-- Safe to re-run (IF NOT EXISTS).
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS break_until date;

COMMENT ON COLUMN students.break_until IS
  'When an on-break student is expected to return. Only meaningful while status = ''on_break''.';

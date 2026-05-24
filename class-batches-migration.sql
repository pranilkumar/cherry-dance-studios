-- ════════════════════════════════════════════════════════════════════
-- Cherry Dance Studios — Class Batches
-- Creates the class_batches table and adds class_batch_id to students.
--
-- HOW TO RUN:
--   1. Open Supabase → SQL Editor
--   2. Paste this entire file
--   3. Click "Run"
--
-- Idempotent: safe to re-run.
-- ════════════════════════════════════════════════════════════════════

-- 1. class_batches table
CREATE TABLE IF NOT EXISTS class_batches (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,           -- e.g. "Mon & Wed 6–7 PM"
  tier        TEXT,                    -- 'Little Stars', 'The Crew', 'Slay Squad'
  style       TEXT,                    -- 'Bollywood', 'Hip-Hop', etc.
  instructor  TEXT,                    -- 'Cherry', 'Pranil', 'Cherry & Pranil'
  weekdays    TEXT[] NOT NULL DEFAULT '{}', -- ['Monday', 'Wednesday']
  start_time  TEXT NOT NULL,           -- '18:00' (HH:MM 24-hour)
  end_time    TEXT,                    -- '19:00'
  is_active   BOOLEAN DEFAULT true,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS class_batches_active_idx ON class_batches(is_active);

-- 2. Add class_batch_id FK to students
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS class_batch_id UUID REFERENCES class_batches(id) ON DELETE SET NULL;

-- 3. RLS — same open pattern as the rest of the app
ALTER TABLE class_batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "class_batches_all" ON class_batches;
CREATE POLICY "class_batches_all" ON class_batches
  FOR ALL USING (true) WITH CHECK (true);

-- 4. updated_at trigger
DROP TRIGGER IF EXISTS class_batches_set_updated_at ON class_batches;
CREATE TRIGGER class_batches_set_updated_at
  BEFORE UPDATE ON class_batches
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Verification:
-- SELECT id, name, weekdays, start_time FROM class_batches;
-- SELECT id, student_name, class_batch_id FROM students LIMIT 10;

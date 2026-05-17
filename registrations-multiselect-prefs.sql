-- ════════════════════════════════════════════════════════════════════
-- Cherry Dance Studios — registrations: multi-select preferred days/times
-- Converts preferred_weekday / preferred_time_slot from text to text[],
-- and renames them to plural form.
--
-- HOW TO RUN:
--   1. Open Supabase → SQL Editor
--   2. Paste this file
--   3. Click "Run"
--
-- One-shot migration — running it twice will error on the second pass
-- (the columns are already the new type / new name).
-- Existing single-value rows become single-element arrays.
-- ════════════════════════════════════════════════════════════════════

-- 1) Convert preferred_weekday to text[]
ALTER TABLE registrations
  ALTER COLUMN preferred_weekday TYPE text[]
    USING CASE
      WHEN preferred_weekday IS NULL OR preferred_weekday = '' THEN NULL
      ELSE ARRAY[preferred_weekday]
    END;

-- 2) Convert preferred_time_slot to text[]
ALTER TABLE registrations
  ALTER COLUMN preferred_time_slot TYPE text[]
    USING CASE
      WHEN preferred_time_slot IS NULL OR preferred_time_slot = '' THEN NULL
      ELSE ARRAY[preferred_time_slot]
    END;

-- 3) Rename to plural so the column names match their new shape
ALTER TABLE registrations RENAME COLUMN preferred_weekday   TO preferred_weekdays;
ALTER TABLE registrations RENAME COLUMN preferred_time_slot TO preferred_time_slots;

-- Verification:
-- SELECT column_name, data_type, udt_name FROM information_schema.columns
--   WHERE table_name = 'registrations' AND column_name LIKE 'preferred%';
-- Should show both as data_type='ARRAY' / udt_name='_text'

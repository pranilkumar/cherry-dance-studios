-- ════════════════════════════════════════════════════════════════════
-- Cherry Dance Studios — convert_registration_to_student RPC
-- Fixes: "Could not find the function public.convert_registration_to_student
--        (registration_id) in the schema cache"
--
-- What this does:
--   1. Adds the new optional columns to `students` so nothing is lost when
--      we convert (allergies, emergency_contact, photo_consent, heard_from).
--   2. (Re)creates the RPC against the CURRENT schema:
--        - registrations.preferred_weekdays / preferred_time_slots are text[]
--        - students.preferred_weekday / preferred_time_slot are still text
--        - we flatten array -> comma-separated string on insert
--   3. Notifies PostgREST so the function shows up immediately.
--
-- HOW TO RUN:
--   1. Open Supabase → SQL Editor
--   2. Paste this whole file
--   3. Click "Run"
--
-- Safe to re-run (uses IF NOT EXISTS / CREATE OR REPLACE).
-- ════════════════════════════════════════════════════════════════════

-- 0) Make sure the registrations table has every column the function READS.
--    The PL/pgSQL %ROWTYPE binds at compile time, so any missing column
--    here causes "record reg_record has no field X" at call time.
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS parent_name           text,
  ADD COLUMN IF NOT EXISTS student_name          text,
  ADD COLUMN IF NOT EXISTS email                 text,
  ADD COLUMN IF NOT EXISTS phone                 text,
  ADD COLUMN IF NOT EXISTS date_of_birth         date,
  ADD COLUMN IF NOT EXISTS gender                text,
  ADD COLUMN IF NOT EXISTS preferred_class       text,
  ADD COLUMN IF NOT EXISTS preferred_weekdays    text[],
  ADD COLUMN IF NOT EXISTS preferred_time_slots  text[],
  ADD COLUMN IF NOT EXISTS experience_level      text,
  ADD COLUMN IF NOT EXISTS allergies             text,
  ADD COLUMN IF NOT EXISTS emergency_contact     text,
  ADD COLUMN IF NOT EXISTS photo_consent         boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS heard_from            text,
  ADD COLUMN IF NOT EXISTS status                text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS notes                 text,
  ADD COLUMN IF NOT EXISTS converted_to_student_id uuid,
  ADD COLUMN IF NOT EXISTS converted_at          timestamptz;

-- 1) Make sure the students table has every column the function writes to.
--    Some of these were in the original schema, some are newer — using
--    IF NOT EXISTS so this is safe no matter what state your table is in.
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS parent_name         text,
  ADD COLUMN IF NOT EXISTS student_name        text,
  ADD COLUMN IF NOT EXISTS email               text,
  ADD COLUMN IF NOT EXISTS phone               text,
  ADD COLUMN IF NOT EXISTS date_of_birth       date,
  ADD COLUMN IF NOT EXISTS gender              text,
  ADD COLUMN IF NOT EXISTS preferred_class     text,
  ADD COLUMN IF NOT EXISTS preferred_weekday   text,
  ADD COLUMN IF NOT EXISTS preferred_time_slot text,
  ADD COLUMN IF NOT EXISTS experience_level    text,
  ADD COLUMN IF NOT EXISTS allergies           text,
  ADD COLUMN IF NOT EXISTS emergency_contact   text,
  ADD COLUMN IF NOT EXISTS photo_consent       boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS heard_from          text,
  ADD COLUMN IF NOT EXISTS status              text DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS enrollment_date     timestamptz DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS notes               text;

-- 2) Drop any stale signature, then create the fresh function.
DROP FUNCTION IF EXISTS convert_registration_to_student(uuid);
DROP FUNCTION IF EXISTS convert_registration_to_student(uuid, timestamp);
DROP FUNCTION IF EXISTS convert_registration_to_student(uuid, timestamptz);

CREATE OR REPLACE FUNCTION convert_registration_to_student(
  registration_id  uuid,
  enrollment_date  timestamptz DEFAULT NOW()
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_student_id uuid;
  reg_record     registrations%ROWTYPE;
BEGIN
  SELECT * INTO reg_record FROM registrations WHERE id = registration_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Registration % not found', registration_id;
  END IF;

  IF reg_record.status = 'converted' THEN
    RAISE EXCEPTION 'Registration % already converted', registration_id;
  END IF;

  -- Insert into students. Flatten the text[] preference arrays into a
  -- comma-separated string so they fit the singular text columns.
  INSERT INTO students (
    parent_name,
    student_name,
    email,
    phone,
    date_of_birth,
    gender,
    preferred_class,
    preferred_weekday,
    preferred_time_slot,
    experience_level,
    allergies,
    emergency_contact,
    photo_consent,
    heard_from,
    status,
    enrollment_date,
    notes
  ) VALUES (
    reg_record.parent_name,
    reg_record.student_name,
    reg_record.email,
    reg_record.phone,
    reg_record.date_of_birth,
    reg_record.gender,
    reg_record.preferred_class,
    array_to_string(reg_record.preferred_weekdays,   ', '),
    array_to_string(reg_record.preferred_time_slots, ', '),
    reg_record.experience_level,
    reg_record.allergies,
    reg_record.emergency_contact,
    reg_record.photo_consent,
    reg_record.heard_from,
    'active',
    enrollment_date,
    reg_record.notes
  )
  RETURNING id INTO new_student_id;

  UPDATE registrations
     SET status                  = 'converted',
         converted_to_student_id = new_student_id,
         converted_at            = NOW()
   WHERE id = registration_id;

  RETURN new_student_id;
END;
$$;

-- 3) Let anon + authenticated invoke it (matches the rest of the app's
--    "loose RLS, admin-gated in the UI" pattern). Adjust if you tighten later.
GRANT EXECUTE ON FUNCTION convert_registration_to_student(uuid, timestamptz)
  TO anon, authenticated, service_role;

-- 4) Tell PostgREST to refresh its schema cache so the RPC is visible
--    without waiting for the next auto-reload.
NOTIFY pgrst, 'reload schema';

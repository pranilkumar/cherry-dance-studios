-- ════════════════════════════════════════════════════════════════════
-- Cherry Dance Studios — add email_secondary to registrations + students
-- and update the convert RPC to carry it across.
--
-- HOW TO RUN:
--   1. Open Supabase → SQL Editor
--   2. Paste this whole file and click "Run"
--
-- Safe to re-run (IF NOT EXISTS / CREATE OR REPLACE).
-- ════════════════════════════════════════════════════════════════════

-- 1. Add column to both tables
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS email_secondary text;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS email_secondary text;

-- 2. Update the RPC so it carries email_secondary across on conversion.
--    (Full recreation — must stay in sync with convert-registration-fn.sql)

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

  INSERT INTO students (
    parent_name,
    student_name,
    email,
    email_secondary,
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
    reg_record.email_secondary,
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

GRANT EXECUTE ON FUNCTION convert_registration_to_student(uuid, timestamptz)
  TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';

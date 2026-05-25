-- Add batch_days column to students table
-- This allows a student in a multi-day batch (e.g. Mon + Wed) to be marked
-- as attending only certain days (e.g. only Monday).
-- NULL or an empty array means the student attends ALL days in their batch.

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS batch_days TEXT[] DEFAULT NULL;

COMMENT ON COLUMN students.batch_days IS
  'Subset of the assigned batch''s weekdays this student attends. NULL = attends all days.';

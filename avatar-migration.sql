-- ════════════════════════════════════════════════════════════════════
-- Cherry Dance Studios — student avatar support
--
-- HOW TO RUN:
--   1. Open Supabase → SQL Editor
--   2. Paste this whole file and click "Run"
--
-- Safe to re-run (IF NOT EXISTS / ON CONFLICT DO NOTHING).
-- ════════════════════════════════════════════════════════════════════

-- 1. Add avatar_url column to students
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Create the storage bucket (public, 5 MB limit, images only)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-avatars',
  'student-avatars',
  true,
  5242880,   -- 5 MB
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS policies
--    The portal uses the anon key, so we allow all operations with USING (true).
--    These are scoped to the student-avatars bucket only.

DROP POLICY IF EXISTS "student-avatars read"   ON storage.objects;
DROP POLICY IF EXISTS "student-avatars upload" ON storage.objects;
DROP POLICY IF EXISTS "student-avatars update" ON storage.objects;
DROP POLICY IF EXISTS "student-avatars delete" ON storage.objects;

CREATE POLICY "student-avatars read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'student-avatars');

CREATE POLICY "student-avatars upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'student-avatars');

CREATE POLICY "student-avatars update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'student-avatars');

CREATE POLICY "student-avatars delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'student-avatars');

-- ─────────────────────────────────────────────────────────────────────────────
-- Audio Mixes
-- Run this in Supabase SQL Editor.
-- Then follow the Storage bucket setup steps below.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Table ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audio_mixes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT,
  file_url    TEXT        NOT NULL,
  file_name   TEXT,
  batch_id    UUID        REFERENCES class_batches(id) ON DELETE SET NULL,
  is_public   BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE audio_mixes ENABLE ROW LEVEL SECURITY;

-- Portal users and admin (both use anon key) can read all mixes.
-- Filtering to "what this parent should see" is done in application code.
DROP POLICY IF EXISTS "audio_mixes_read"   ON audio_mixes;
DROP POLICY IF EXISTS "audio_mixes_insert" ON audio_mixes;
DROP POLICY IF EXISTS "audio_mixes_delete" ON audio_mixes;

CREATE POLICY "audio_mixes_read"   ON audio_mixes FOR SELECT USING (true);
CREATE POLICY "audio_mixes_insert" ON audio_mixes FOR INSERT WITH CHECK (true);
CREATE POLICY "audio_mixes_delete" ON audio_mixes FOR DELETE USING (true);

-- 3. Storage bucket ────────────────────────────────────────────────────────────
-- Create the bucket (idempotent):
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-mixes',
  'audio-mixes',
  true,           -- public bucket → simple public URLs, no signed URLs needed
  52428800,       -- 50 MB per file
  ARRAY['audio/mpeg','audio/wav','audio/ogg','audio/aac','audio/mp4','audio/webm','audio/x-m4a']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies:
DROP POLICY IF EXISTS "audio_mixes_storage_read"   ON storage.objects;
DROP POLICY IF EXISTS "audio_mixes_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "audio_mixes_storage_delete" ON storage.objects;

CREATE POLICY "audio_mixes_storage_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'audio-mixes');

CREATE POLICY "audio_mixes_storage_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'audio-mixes');

CREATE POLICY "audio_mixes_storage_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'audio-mixes');

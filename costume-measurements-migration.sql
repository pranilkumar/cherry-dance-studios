-- Costume Measurements Table
-- Run this in your Supabase SQL Editor.

CREATE TABLE costume_measurements (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_slug      TEXT NOT NULL,
  child_name      TEXT NOT NULL,
  parent_name     TEXT NOT NULL,
  phone           TEXT NOT NULL,
  lehenga_waist   NUMERIC(5,2) NOT NULL,
  lehenga_length  NUMERIC(5,2) NOT NULL,
  blouse_chest    NUMERIC(5,2) NOT NULL,
  blouse_lower_bust NUMERIC(5,2) NOT NULL,
  blouse_waist    NUMERIC(5,2) NOT NULL,
  blouse_shoulder NUMERIC(5,2) NOT NULL,
  blouse_sleeve   NUMERIC(5,2) NOT NULL,
  blouse_armhole  NUMERIC(5,2) NOT NULL,
  blouse_front    NUMERIC(5,2) NOT NULL,
  blouse_back     NUMERIC(5,2) NOT NULL,
  submitted_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_costume_measurements_event ON costume_measurements(event_slug);
CREATE INDEX idx_costume_measurements_submitted ON costume_measurements(submitted_at);

-- Allow anyone to insert (public form, no auth required)
ALTER TABLE costume_measurements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public insert" ON costume_measurements FOR INSERT WITH CHECK (true);
-- Only service role (used by admin API) can read — anon key cannot read
CREATE POLICY "Service read" ON costume_measurements FOR SELECT USING (false);

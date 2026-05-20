-- ════════════════════════════════════════════════════════════════════
-- Cherry Dance Studios — track welcome-email success per registration
-- Lets the admin Enquiries page show which conversions actually sent
-- the parent's welcome email vs which silently hit Supabase's hourly
-- rate limit.
--
-- HOW TO RUN:
--   1. Open Supabase → SQL Editor
--   2. Paste this file
--   3. Click "Run"
--
-- Safe to re-run (IF NOT EXISTS).
-- ════════════════════════════════════════════════════════════════════

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at timestamptz;

COMMENT ON COLUMN registrations.welcome_email_sent_at IS
  'When the post-conversion welcome email was successfully sent. NULL means email not sent yet — either still pending or it failed (often a Supabase rate limit hit). Used by admin UI to surface "Resend" actions.';

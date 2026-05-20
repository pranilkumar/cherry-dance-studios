# Supabase email templates

Source of truth for the branded HTML emails Supabase sends. These files
live in the repo so future edits don't get lost — but they're not
deployed by code. You have to paste them into the Supabase dashboard.

## Files

| File | When it's sent | Subject line to set |
|------|---------------|---------------------|
| `confirm-signup.html` | First sign-in for a brand-new parent (e.g. right after admin clicks "Convert" on their registration) | `Welcome to Cherry Dance Studios — your sign-in code` |
| `magic-link.html` | Every return sign-in after that | `Your Cherry Dance Studios sign-in code` |
| `recovery.html` | Parent clicks "Forgot password?" on the login page | `Reset your Cherry Dance Studios password` |

Both templates use the same Supabase variables:
- `{{ .Token }}` — 6-digit OTP code
- `{{ .ConfirmationURL }}` — magic-link URL (backup if they don't type the code)
- `{{ .SiteURL }}` — Site URL from Auth → URL Configuration
- `{{ .Email }}` — recipient's email

## How to deploy a change

1. Edit the `.html` file here and commit the change (so we have history).
2. Open Supabase Dashboard → **Authentication** → **Email Templates**.
3. Pick the matching template from the dropdown ("Confirm Signup" or
   "Magic Link").
4. Update the **Subject** line per the table above.
5. Paste the entire file contents into the **Message body** field
   (replacing whatever's there).
6. Click **Save**.
7. Trigger a real sign-in to a throwaway address and verify the email
   renders correctly in Gmail / Apple Mail.

## Why two templates

Supabase picks the template based on whether the recipient is a
brand-new user in `auth.users`:

- **Not in auth.users yet** → "Confirm Signup" template fires. This is
  the parent's first contact with the portal, so it leans warm and
  explains what the portal does.
- **Already in auth.users** → "Magic Link" template fires. They've
  seen the welcome before, so this one is short and code-first.

Both need `{{ .Token }}` somewhere prominent — that's what the 6-digit
code flow on `/portal/login` verifies. The link still works as a
backup but is intentionally de-emphasized because it has device /
redirect-URL pitfalls the code doesn't.

## Editing tips

- These are HTML emails — keep all styles **inline** (no `<style>`
  blocks except in `<head>`, and even those get stripped by Gmail).
- Layout uses nested `<table>` elements for compatibility — every
  modern email client still falls back to table layouts.
- Tested in Gmail (web + iOS + Android), Apple Mail, Outlook desktop.
- Dark theme is opt-in via `<meta name="color-scheme" content="dark">`
  but light-mode clients still render correctly because all colors are
  explicit.

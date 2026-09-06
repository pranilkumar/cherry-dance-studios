import { NextResponse } from 'next/server';

const FROM = 'Cherry Dance Studios <noreply@cherrydancestudios.com>';

/** Escape characters that are special in HTML. */
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

// ─── Simple in-memory rate limiter ───────────────────────────────────────────
// 3 notifications per 15 minutes per IP (tighter to limit abuse).
const RATE_WINDOW_MS = 15 * 60 * 1000;
const RATE_MAX       = 3;
const ipMap          = new Map();

function isRateLimited(ip) {
  const now    = Date.now();
  const record = ipMap.get(ip) ?? { count: 0, resetAt: now + RATE_WINDOW_MS };
  if (now > record.resetAt) { record.count = 0; record.resetAt = now + RATE_WINDOW_MS; }
  record.count++;
  ipMap.set(ip, record);
  return record.count > RATE_MAX;
}

// ─── Email builders ───────────────────────────────────────────────────────────

function buildRegistrationHtml(data) {
  const { studentName, parentName, email, phone, dob, preferredClass,
          preferredDays, preferredTimes, experience, notes, adminUrl } = data;

  const rows = [
    ['Student',         esc(studentName)],
    ['Parent / guardian', esc(parentName)],
    ['Email',           `<a href="mailto:${esc(email)}" style="color:#ee2435;">${esc(email)}</a>`],
    ['Phone',           esc(phone)],
    ['Date of birth',   esc(dob)],
    ['Preferred class', esc(preferredClass)],
    ['Preferred days',  esc(Array.isArray(preferredDays) ? preferredDays.join(', ') : preferredDays)],
    ['Preferred times', esc(Array.isArray(preferredTimes) ? preferredTimes.join(', ') : preferredTimes)],
    ['Experience',      esc(experience || 'Not specified')],
    notes?.trim() ? ['Notes', esc(notes)] : null,
  ].filter(Boolean);

  return buildShell({
    preheader: `New registration from ${esc(parentName)} for ${esc(studentName)}.`,
    badgeText: 'NEW REGISTRATION',
    headline:  'New student registration.',
    rows,
    ctaHref:   adminUrl,
    ctaLabel:  'Review in admin panel',
  });
}

function buildWorkshopHtml(data) {
  const { workshopTitle, parentName, email, phone,
          packageLabel, dietaryNotes, adminUrl } = data;

  const rows = [
    ['Workshop',  esc(workshopTitle)],
    ['Attendee',  esc(parentName)],
    ['Email',     `<a href="mailto:${esc(email)}" style="color:#ee2435;">${esc(email)}</a>`],
    ['Phone',     esc(phone)],
    packageLabel ? ['Package', esc(packageLabel)] : null,
    dietaryNotes?.trim() ? ['Dietary notes', esc(dietaryNotes)] : null,
  ].filter(Boolean);

  return buildShell({
    preheader: `New workshop booking from ${esc(parentName)} for ${esc(workshopTitle)}.`,
    badgeText: 'NEW WORKSHOP BOOKING',
    headline:  'New workshop booking.',
    rows,
    ctaHref:   adminUrl,
    ctaLabel:  'View bookings in admin panel',
  });
}

/** Shared dark email shell — same design language as payment/reminder emails. */
function buildShell({ preheader, badgeText, headline, rows, ctaHref, ctaLabel }) {
  const rowsHtml = rows.map(([label, value]) => `
    <tr>
      <td style="padding:6px 0;font-size:12px;color:rgba(255,255,255,0.45);width:140px;vertical-align:top;">${label}</td>
      <td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,0.88);vertical-align:top;">${value}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="only dark">
  <meta name="supported-color-schemes" content="only dark">
  <title>${esc(headline)} · Cherry Dance Studios</title>
  <style type="text/css">
    .logo-bg { background-color: #0a0a0f !important; }
    [data-ogsc] .logo-bg { background-color: #0a0a0f !important; }
    [data-ogsb] .logo-bg { background-color: #0a0a0f !important; }
    @media (prefers-color-scheme: dark) { .logo-bg { background-color: #0a0a0f !important; } }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#ffffff;-webkit-font-smoothing:antialiased;color-scheme:only dark;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${preheader}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0a0f;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:520px;background-color:#12121a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);" cellpadding="0" cellspacing="0" border="0">

          <!-- Brand band -->
          <tr>
            <td style="background:linear-gradient(135deg,#b00310 0%,#d1060f 50%,#ee2435 100%);padding:22px 28px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td valign="middle" width="46" style="line-height:0;padding-right:14px;">
                    <!--[if !mso]><!-->
                    <div class="logo-bg" style="display:inline-block;background-color:#0a0a0f !important;border:1.5px solid rgba(255,255,255,0.25);border-radius:999px;padding:6px;line-height:0;vertical-align:middle;">
                      <img src="https://cherrydancestudios.com/logo.png" alt="CDS" width="30" height="30" style="display:block;width:30px;height:30px;border:0;outline:none;">
                    </div>
                    <!--<![endif]-->
                  </td>
                  <td valign="middle">
                    <div style="font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.85);">
                      CHERRY DANCE STUDIOS &nbsp;&middot;&nbsp; ${esc(badgeText)}
                    </div>
                    <h1 style="margin:4px 0 0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;line-height:1.2;">
                      ${esc(headline)}
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Detail rows -->
          <tr>
            <td style="padding:24px 28px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background-color:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px 20px;">
                <tr><td>
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                    ${rowsHtml}
                  </table>
                </td></tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:0 28px 28px;">
              <a href="${ctaHref}"
                 style="display:inline-block;background:linear-gradient(135deg,#b00310 0%,#d1060f 50%,#ee2435 100%);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:8px;">
                ${esc(ctaLabel)} →
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:rgba(0,0,0,0.35);padding:16px 28px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
              <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3);">Cherry Dance Studios &middot; Barrhaven, Ottawa</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(request) {
  // Origin check — only accept requests from the same site (prevents cross-site abuse).
  // Skip in development where origin may be localhost or undefined.
  const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.NODE_ENV === 'production' && siteOrigin) {
    const origin = request.headers.get('origin') ?? '';
    if (!origin.startsWith(siteOrigin)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Rate limit by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Email not configured' }, { status: 500 });
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    return NextResponse.json({ error: 'ADMIN_EMAIL not configured' }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { type } = body;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cherrydancestudios.com';

  let subject, html;

  if (type === 'registration') {
    const { studentName, parentName, email } = body;
    if (!studentName || !parentName || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    subject = `New registration · ${studentName}`;
    html = buildRegistrationHtml({
      ...body,
      adminUrl: `${siteUrl}/admin/registrations`,
    });

  } else if (type === 'workshop') {
    const { workshopTitle, parentName, email } = body;
    if (!workshopTitle || !parentName || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    subject = `New workshop booking · ${workshopTitle} — ${parentName}`;
    html = buildWorkshopHtml({
      ...body,
      adminUrl: `${siteUrl}/admin/workshop`,
    });

  } else {
    return NextResponse.json({ error: 'Unknown notification type' }, { status: 400 });
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: adminEmail, subject, html }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('[notify-admin] Resend error:', err);
    // Don't fail the caller — notification failure is non-critical.
    return NextResponse.json({ ok: false, warning: 'Notification email failed' });
  }

  return NextResponse.json({ ok: true });
}

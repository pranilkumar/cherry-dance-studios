import { NextResponse } from 'next/server';
import { verifyAdminToken, ADMIN_COOKIE } from '../../../src/lib/adminAuth';

const FROM = 'Cherry Dance Studios <noreply@cherrydancestudios.com>';
const esc = (v: any) =>
  String(v ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' }[c] ?? c));

export async function POST(request: Request) {
  const token = (request as any).cookies?.get?.(ADMIN_COOKIE)?.value;
  const internalToken = request.headers.get('x-internal-webhook');
  const isInternal = internalToken && internalToken === process.env.STRIPE_WEBHOOK_SECRET;
  if (!isInternal && !verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  const {
    email,
    parentName,
    workshopTitle,
    workshopDate,
    workshopVenue,
    packageLabel,
    amountCents,
    ticketUrl,
  } = await request.json();

  if (!email || !workshopTitle) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const firstName = String(parentName ?? '').split(' ')[0] || 'there';
  const formattedAmount = amountCents
    ? new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amountCents / 100)
    : null;

  const detailRows = [
    workshopDate   ? `<tr><td style="padding:6px 0;font-size:12px;color:rgba(255,255,255,0.45);width:110px;">Date</td><td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,0.88);">${esc(workshopDate)}</td></tr>` : '',
    workshopVenue  ? `<tr><td style="padding:6px 0;font-size:12px;color:rgba(255,255,255,0.45);">Venue</td><td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,0.88);">${esc(workshopVenue)}</td></tr>` : '',
    packageLabel   ? `<tr><td style="padding:6px 0;font-size:12px;color:rgba(255,255,255,0.45);">Package</td><td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,0.88);">${esc(packageLabel)}${formattedAmount ? ' — ' + esc(formattedAmount) : ''}</td></tr>` : '',
    formattedAmount && !packageLabel ? `<tr><td style="padding:6px 0;font-size:12px;color:rgba(255,255,255,0.45);">Amount</td><td style="padding:6px 0;font-size:13px;color:rgba(255,255,255,0.88);">${esc(formattedAmount)}</td></tr>` : '',
  ].filter(Boolean).join('');

  const ticketButton = ticketUrl
    ? `<div style="margin:24px 0;text-align:center;"><a href="${esc(ticketUrl)}" style="display:inline-block;background:linear-gradient(135deg,#b00310 0%,#d1060f 50%,#ee2435 100%);color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:999px;">View my ticket &amp; QR code →</a></div>`
    : '';

  const beforeYouCome = [
    'Head to the Main Hall inside Cardel Recreation Complex',
    'Free parking is available in the lot right in front of the recreation centre',
    'Arrive 10 minutes early for check-in',
    'Wear comfortable clothes you can move in',
    'Bring a water bottle',
  ];

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Payment confirmed · ${esc(workshopTitle)}</title></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#fff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" style="max-width:520px;background:#12121a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);" cellpadding="0" cellspacing="0">

      <!-- Header band -->
      <tr><td style="background:linear-gradient(135deg,#b00310 0%,#d1060f 50%,#ee2435 100%);padding:24px 28px;">
        <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:rgba(255,255,255,0.75);">Cherry Dance Studios · Payment confirmed</p>
        <h1 style="margin:0;font-size:24px;font-weight:800;color:#fff;">You&rsquo;re all set, ${esc(firstName)}!</h1>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:24px 28px 8px;">
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.75);">We&rsquo;ve received your payment for <strong style="color:#fff;">${esc(workshopTitle)}</strong>. Your spot is confirmed — we can&rsquo;t wait to see you there.</p>

        <!-- Booking details -->
        ${detailRows ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px 20px;margin-bottom:20px;"><tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${detailRows}</table></td></tr></table>` : ''}

        <!-- Ticket button -->
        ${ticketButton}

        <!-- Before you come -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px 20px;margin-bottom:24px;">
          <tr><td>
            <p style="margin:0 0 12px;font-size:10px;font-weight:700;letter-spacing:0.22em;text-transform:uppercase;color:rgba(255,255,255,0.4);">Before you come</p>
            ${beforeYouCome.map((item) => `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;"><tr>
              <td width="18" valign="top" style="padding-top:2px;font-size:13px;color:#ee2435;">·</td>
              <td style="font-size:13px;line-height:1.5;color:rgba(255,255,255,0.8);">${esc(item)}</td>
            </tr></table>`).join('')}
          </td></tr>
        </table>

        <p style="margin:0 0 24px;font-size:12px;color:rgba(255,255,255,0.4);text-align:center;">Questions? <a href="https://wa.me/16138903789" style="color:#ee2435;text-decoration:none;">WhatsApp 613-890-3789</a></p>
      </td></tr>

      <!-- Footer -->
      <tr><td style="background:rgba(0,0,0,0.35);padding:14px 28px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
        <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.3);">Cherry Dance Studios · Barrhaven, Ottawa</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: email,
      subject: `Payment confirmed — ${workshopTitle}`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: (err as any).message || 'Failed to send email' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

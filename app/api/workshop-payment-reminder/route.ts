import { NextResponse } from 'next/server';
import { verifyAdminToken, ADMIN_COOKIE } from '../../../src/lib/adminAuth';

const FROM = 'Cherry Dance Studios <noreply@cherrydancestudios.com>';
const esc = (v: any) =>
  String(v ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' }[c] ?? c));

export async function POST(request: Request) {
  const token = (request as any).cookies?.get?.(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  const { email, parentName, workshopTitle, workshopDate, amountCents, ticketUrl } =
    await request.json();

  if (!email || !workshopTitle) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const firstName = String(parentName ?? '').split(' ')[0] || 'there';
  const formattedAmount = amountCents
    ? new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amountCents / 100)
    : null;

  const ticketButton = ticketUrl
    ? `<div style="margin:24px 0;text-align:center;"><a href="${esc(ticketUrl)}" style="display:inline-block;background:linear-gradient(135deg,#b00310 0%,#d1060f 50%,#ee2435 100%);color:#fff;font-size:15px;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:999px;">View my ticket →</a></div>`
    : '';

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Just one step left · ${esc(workshopTitle)}</title></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#fff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" style="max-width:520px;background:#12121a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);" cellpadding="0" cellspacing="0">

      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#b00310 0%,#d1060f 50%,#ee2435 100%);padding:24px 28px;">
        <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:rgba(255,255,255,0.75);">Cherry Dance Studios</p>
        <h1 style="margin:0;font-size:24px;font-weight:800;color:#fff;">See you ${workshopDate ? esc(workshopDate) : 'soon'} — just one step left! 🎉</h1>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:24px 28px;">
        <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:rgba(255,255,255,0.75);">
          Hi ${esc(firstName)}, so excited to have you at <strong style="color:#fff;">${esc(workshopTitle)}</strong>! To confirm your spot, please send${formattedAmount ? ` <strong style="color:#fff;">${esc(formattedAmount)}</strong>` : ' your payment'} via e-transfer to <a href="mailto:cherrydancestudio.cds@gmail.com" style="color:#ee2435;text-decoration:none;">cherrydancestudio.cds@gmail.com</a> with your name in the message.
        </p>

        ${ticketButton}

        <p style="margin:0 0 8px;font-size:13px;line-height:1.6;color:rgba(255,255,255,0.65);">
          Feel free to email us at <a href="mailto:cherrydancestudio.cds@gmail.com" style="color:#ee2435;text-decoration:none;">cherrydancestudio.cds@gmail.com</a> or call us at <a href="tel:+16138903789" style="color:#ee2435;text-decoration:none;">613-890-3789</a> if you have any questions.
        </p>

        <p style="margin:20px 0 0;font-size:13px;color:rgba(255,255,255,0.75);">
          See you on the dance floor! 💃<br>
          <strong style="color:#fff;">Cherry &amp; Pranil</strong><br>
          <span style="color:rgba(255,255,255,0.45);">Cherry Dance Studios</span>
        </p>
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
      subject: `Just one step left — ${workshopTitle} 🎉`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: (err as any).message || 'Failed to send email' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

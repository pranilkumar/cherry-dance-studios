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

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Quick reminder · ${esc(workshopTitle)}</title></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#fff;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" style="max-width:520px;background:#12121a;border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.06);" cellpadding="0" cellspacing="0">

      <!-- Header -->
      <tr><td style="background:linear-gradient(135deg,#b00310 0%,#d1060f 50%,#ee2435 100%);padding:24px 28px;">
        <p style="margin:0 0 6px;font-size:10px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:rgba(255,255,255,0.75);">Cherry Dance Studios</p>
        <h1 style="margin:0;font-size:22px;font-weight:800;color:#fff;">Quick reminder 👋</h1>
      </td></tr>

      <!-- Body -->
      <tr><td style="padding:28px 28px 24px;">
        <p style="margin:0;font-size:15px;line-height:1.7;color:rgba(255,255,255,0.82);">
          Hi ${esc(firstName)} 👋 Just a friendly reminder — your spot for <strong style="color:#fff;">${esc(workshopTitle)}</strong>${workshopDate ? ` on <strong style="color:#fff;">${esc(workshopDate)}</strong>` : ''} is reserved but payment is still pending. It&rsquo;s in the Main Hall at Cardel Recreation Complex (free parking right out front). Please e-transfer${formattedAmount ? ` <strong style="color:#fff;">${esc(formattedAmount)}</strong>` : ' your payment'} to <a href="mailto:cherrydancestudio.cds@gmail.com" style="color:#ee2435;text-decoration:none;">cherrydancestudio.cds@gmail.com</a> to confirm your spot. Questions? Just reply here 💃
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
      reply_to: 'cherrydancestudio.cds@gmail.com',
      to: email,
      subject: `Quick reminder — ${workshopTitle} 👋`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: (err as any).message || 'Failed to send email' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

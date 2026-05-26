import { NextResponse } from 'next/server';

const FROM = 'Cherry Dance Studios <noreply@cherrydancestudios.com>';

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;' };
const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

function buildHtml({ studentName, parentName, amount, feeType, dueDate, month }: {
  studentName: string;
  parentName?: string;
  amount: number;
  feeType: string;
  dueDate: string;
  month: string;
}) {
  const sName = esc(studentName);
  const pFirst = esc(parentName ? parentName.split(' ')[0] : '');
  const sFeeType = esc(feeType);
  const sMonth = esc(month);

  const formattedAmount = new Intl.NumberFormat('en-CA', {
    style: 'currency', currency: 'CAD',
  }).format(amount);

  const formattedDate = new Date(dueDate + 'T00:00:00').toLocaleDateString('en-CA', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="only dark">
  <meta name="supported-color-schemes" content="only dark">
  <title>New fee · Cherry Dance Studios</title>
  <style type="text/css">
    .logo-bg { background-color: #0a0a0f !important; }
    [data-ogsc] .logo-bg { background-color: #0a0a0f !important; }
    [data-ogsb] .logo-bg { background-color: #0a0a0f !important; }
    @media (prefers-color-scheme: dark) { .logo-bg { background-color: #0a0a0f !important; } }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#ffffff;-webkit-font-smoothing:antialiased;color-scheme:only dark;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    Your ${sMonth} fee of ${formattedAmount} for ${sName} is now ready. Due ${formattedDate}.
  </div>

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
                      <img src="https://cherrydancestudios.com/logo.png" alt="CDS" width="30" height="30"
                           style="display:block;width:30px;height:30px;border:0;outline:none;">
                    </div>
                    <!--<![endif]-->
                  </td>
                  <td valign="middle">
                    <div style="font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.85);">
                      CHERRY DANCE STUDIOS
                    </div>
                    <h1 style="margin:4px 0 0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;line-height:1.2;">
                      New fee ready.
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 28px 20px;">
              <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.78);">
                Hi ${pFirst || 'there'}, your <strong style="color:#ffffff;">${sMonth}</strong> fee for <strong style="color:#ffffff;">${sName}</strong> has been issued.
              </p>

              <!-- Fee box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background-color:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.1);border-radius:12px;">
                <tr>
                  <td style="padding:20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:5px 0;font-size:12px;color:rgba(255,255,255,0.45);width:110px;">Amount</td>
                        <td style="padding:5px 0;font-size:18px;font-weight:700;color:#ffffff;">${formattedAmount}</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:12px;color:rgba(255,255,255,0.45);">For</td>
                        <td style="padding:5px 0;font-size:14px;color:rgba(255,255,255,0.85);">${sFeeType}</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:12px;color:rgba(255,255,255,0.45);">Student</td>
                        <td style="padding:5px 0;font-size:14px;color:rgba(255,255,255,0.85);">${sName}</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:12px;color:rgba(255,255,255,0.45);">Due by</td>
                        <td style="padding:5px 0;font-size:14px;font-weight:600;color:#ffffff;">${formattedDate}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Portal CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
                <tr>
                  <td align="center">
                    <a href="https://cherrydancestudios.com/portal/fees"
                       style="display:inline-block;background:linear-gradient(135deg,#b00310,#ee2435);color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:14px 32px;border-radius:10px;letter-spacing:0.2px;">
                      View in Parent Portal →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- How to pay -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;">
                <tr>
                  <td style="background-color:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:18px 20px;">
                    <div style="font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:10px;">How to pay</div>
                    <p style="margin:0 0 8px;font-size:13px;color:rgba(255,255,255,0.75);">
                      <strong style="color:#ffffff;">E-transfer</strong> to <a href="mailto:cherrydancestudio.cds@gmail.com" style="color:#ee2435;text-decoration:none;">cherrydancestudio.cds@gmail.com</a> — include ${sName}&rsquo;s name in the message.
                    </p>
                    <p style="margin:0;font-size:13px;color:rgba(255,255,255,0.75);">
                      <strong style="color:#ffffff;">Cash</strong> — hand it to Cherry or Pranil at the studio.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:rgba(0,0,0,0.35);padding:18px 28px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
              <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.55);">
                Questions? <a href="https://wa.me/16138903789" style="color:rgba(255,255,255,0.8);text-decoration:none;">WhatsApp us at 613-890-3789</a>
              </p>
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

export async function POST(request: Request) {
  const { verifyAdminToken, ADMIN_COOKIE } = await import('../../../src/lib/adminAuth');
  const token = (request as any).cookies?.get(ADMIN_COOKIE)?.value;
  if (!verifyAdminToken(token)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  let body: {
    month: string;
    fees: Array<{
      email: string;
      emailSecondary?: string;
      studentName: string;
      parentName?: string;
      amount: number;
      feeType: string;
      dueDate: string;
    }>;
  };

  try { body = await request.json(); }
  catch { return NextResponse.json({ error: 'Invalid request body' }, { status: 400 }); }

  if (!body?.month || !Array.isArray(body?.fees) || body.fees.length === 0) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  let sent = 0;
  let failed = 0;

  for (const fee of body.fees) {
    if (!fee.email || !fee.studentName || !fee.amount || !fee.dueDate) {
      failed++;
      continue;
    }

    const recipients = [fee.email, ...(fee.emailSecondary ? [fee.emailSecondary] : [])];
    const html = buildHtml({
      studentName: fee.studentName,
      parentName: fee.parentName,
      amount: fee.amount,
      feeType: fee.feeType || 'Monthly fee',
      dueDate: fee.dueDate,
      month: body.month,
    });

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: FROM,
        to: recipients,
        subject: `${esc(body.month)} fee ready — ${esc(fee.studentName)}`,
        html,
      }),
    });

    if (res.ok) { sent++; } else { failed++; }
  }

  return NextResponse.json({ ok: true, sent, failed });
}

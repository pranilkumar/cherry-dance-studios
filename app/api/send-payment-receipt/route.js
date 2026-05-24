import { NextResponse } from 'next/server';

const FROM = 'Cherry Dance Studios <noreply@cherrydancestudios.com>';

function buildHtml({ studentName, parentName, amount, feeType, paymentDate, paymentMethod }) {
  const formattedAmount = new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount);

  const formattedDate = new Date(paymentDate).toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const methodLabel = {
    cash: 'Cash',
    card: 'Card',
    bank_transfer: 'Bank Transfer',
    'e-transfer': 'E-Transfer',
    cheque: 'Cheque',
  }[paymentMethod] || paymentMethod || 'Not specified';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="only dark">
  <meta name="supported-color-schemes" content="only dark">
  <title>Payment received · Cherry Dance Studios</title>
  <style type="text/css">
    /* Counter iOS Mail's [data-ogsc] dark-mode CSS injection */
    .logo-bg { background-color: #0a0a0f !important; }
    [data-ogsc] .logo-bg { background-color: #0a0a0f !important; }
    [data-ogsb] .logo-bg { background-color: #0a0a0f !important; }
    @media (prefers-color-scheme: dark) { .logo-bg { background-color: #0a0a0f !important; } }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#0a0a0f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#ffffff;-webkit-font-smoothing:antialiased;color-scheme:only dark;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
    We received your payment of ${formattedAmount} for ${studentName}. Thank you!
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
                      <img src="https://cherrydancestudios.com/logo.png"
                           alt="CDS"
                           width="30" height="30"
                           style="display:block;width:30px;height:30px;border:0;outline:none;">
                    </div>
                    <!--<![endif]-->
                  </td>
                  <td valign="middle">
                    <div style="font-size:11px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:rgba(255,255,255,0.85);">
                      CHERRY DANCE STUDIOS &nbsp;&middot;&nbsp; STUDENT PORTAL
                    </div>
                    <h1 style="margin:4px 0 0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.3px;line-height:1.2;">
                      Payment received.
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 28px 20px;">
              <p style="margin:0 0 22px;font-size:15px;line-height:1.6;color:rgba(255,255,255,0.78);">
                Hi ${parentName ? parentName.split(' ')[0] : 'there'}, we&rsquo;ve received your payment for <strong style="color:#ffffff;">${studentName}</strong>. Here&rsquo;s your receipt.
              </p>

              <!-- Receipt box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background-color:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;">
                <!-- Amount row -->
                <tr>
                  <td style="padding:22px 20px 16px;border-bottom:1px solid rgba(255,255,255,0.06);">
                    <div style="font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.4);margin-bottom:6px;">Amount paid</div>
                    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:36px;font-weight:700;color:#ffffff;letter-spacing:-1px;line-height:1;">
                      ${formattedAmount}
                    </div>
                  </td>
                </tr>
                <!-- Detail rows -->
                <tr>
                  <td style="padding:16px 20px 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding:5px 0;font-size:12px;color:rgba(255,255,255,0.45);width:120px;">For</td>
                        <td style="padding:5px 0;font-size:13px;font-weight:600;color:#ffffff;">${feeType}</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:12px;color:rgba(255,255,255,0.45);">Student</td>
                        <td style="padding:5px 0;font-size:13px;color:rgba(255,255,255,0.85);">${studentName}</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0;font-size:12px;color:rgba(255,255,255,0.45);">Date</td>
                        <td style="padding:5px 0;font-size:13px;color:rgba(255,255,255,0.85);">${formattedDate}</td>
                      </tr>
                      <tr>
                        <td style="padding:5px 0 16px;font-size:12px;color:rgba(255,255,255,0.45);">Method</td>
                        <td style="padding:5px 0 16px;font-size:13px;color:rgba(255,255,255,0.85);">${methodLabel}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:rgba(0,0,0,0.35);padding:18px 28px;text-align:center;border-top:1px solid rgba(255,255,255,0.05);">
              <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.55);">
                Questions? WhatsApp us at <a href="https://wa.me/16138903789" style="color:rgba(255,255,255,0.8);text-decoration:none;">613-890-3789</a>
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

export async function POST(request) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email, emailSecondary, studentName, parentName, amount, feeType, paymentDate, paymentMethod } = body;

  if (!email || !studentName || !amount || !paymentDate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const recipients = [email, ...(emailSecondary ? [emailSecondary] : [])];

  const html = buildHtml({ studentName, parentName, amount, feeType, paymentDate, paymentMethod });

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM,
      to: recipients,
      subject: `Payment received — ${studentName}`,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('[payment-receipt] Resend error:', err);
    return NextResponse.json({ error: err.message || 'Failed to send email' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

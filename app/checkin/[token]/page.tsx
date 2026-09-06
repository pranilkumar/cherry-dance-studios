import { notFound } from 'next/navigation';
import { getBookingByToken } from '../../../src/lib/supabaseAdmin';
import { formatWorkshopDate } from '../../../src/lib/workshops';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Check-in | Cherry Dance Studios',
  robots: { index: false, follow: false },
};

const STATUS_MAP = {
  paid:      { label: 'Paid',             bg: '#0f5132', text: '#d1e7dd' },
  pending:   { label: 'Payment pending',  bg: '#6c2c2c', text: '#f8d7da' },
  cancelled: { label: 'Cancelled',        bg: '#333',    text: '#ccc'    },
  refunded:  { label: 'Refunded',         bg: '#333',    text: '#ccc'    },
};

export default async function CheckinPage({ params }) {
  const { token } = await params;
  const booking = await getBookingByToken(token);

  if (!booking) notFound();

  const { parent_name, parent_email, package_label, amount_cents, payment_status, workshop } = booking;
  const status = STATUS_MAP[payment_status] ?? STATUS_MAP.pending;

  const formatAmount = (cents) =>
    cents != null
      ? new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100)
      : null;

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Check-in · Cherry Dance Studios</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0f; color: #fff; min-height: 100dvh; display: flex; align-items: center; justify-content: center; padding: 24px; }
          .card { background: #111118; border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; width: 100%; max-width: 420px; overflow: hidden; }
          .top { padding: 28px 28px 0; }
          .label { font-size: 10px; font-weight: 700; letter-spacing: 0.22em; text-transform: uppercase; color: #ee2435; }
          .name { font-size: 32px; font-weight: 800; letter-spacing: -0.03em; margin-top: 6px; line-height: 1.1; }
          .workshop { font-size: 15px; color: rgba(255,255,255,0.55); margin-top: 4px; }
          .badge { display: inline-block; margin-top: 16px; padding: 6px 14px; border-radius: 999px; font-size: 11px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; background: ${status.bg}; color: ${status.text}; }
          .divider { border: none; border-top: 1px dashed rgba(255,255,255,0.12); margin: 24px 0 0; }
          .rows { padding: 0 28px 28px; margin-top: 20px; display: flex; flex-direction: column; gap: 14px; }
          .row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; font-size: 14px; }
          .row-label { color: rgba(255,255,255,0.45); white-space: nowrap; }
          .row-value { font-weight: 600; text-align: right; }
          .cds { text-align: center; padding: 0 28px 24px; font-size: 11px; color: rgba(255,255,255,0.25); letter-spacing: 0.08em; }
        `}</style>
      </head>
      <body>
        <div className="card">
          <div className="top">
            <p className="label">Cherry Dance Studios · Check-in</p>
            <p className="name">{parent_name}</p>
            <p className="workshop">{workshop?.title ?? 'Workshop'}</p>
            <span className="badge">{status.label}</span>
            <hr className="divider" />
          </div>
          <div className="rows">
            {workshop?.starts_at && (
              <div className="row">
                <span className="row-label">Date</span>
                <span className="row-value">{formatWorkshopDate(workshop.starts_at)}</span>
              </div>
            )}
            {(workshop?.venue_address || workshop?.venue_name) && (
              <div className="row">
                <span className="row-label">Venue</span>
                <span className="row-value">{workshop.venue_address || workshop.venue_name}</span>
              </div>
            )}
            {package_label && (
              <div className="row">
                <span className="row-label">Package</span>
                <span className="row-value">{package_label}</span>
              </div>
            )}
            {formatAmount(amount_cents) && (
              <div className="row">
                <span className="row-label">Amount</span>
                <span className="row-value">{formatAmount(amount_cents)}</span>
              </div>
            )}
            <div className="row">
              <span className="row-label">Email</span>
              <span className="row-value" style={{ fontSize: 12 }}>{parent_email}</span>
            </div>
          </div>
          <p className="cds">cherrydancestudios.com</p>
        </div>
      </body>
    </html>
  );
}

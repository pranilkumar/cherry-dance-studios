import { notFound } from 'next/navigation';
import { getBookingByToken } from '../../../src/lib/supabaseAdmin';
import { formatWorkshopDate } from '../../../src/lib/workshops';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Check-in | Cherry Dance Studios',
  robots: { index: false, follow: false },
};

const STATUS_MAP = {
  paid:      { label: 'Paid ✓',          bg: '#0f5132', color: '#d1e7dd' },
  pending:   { label: 'Payment pending', bg: '#6c2c2c', color: '#f8d7da' },
  cancelled: { label: 'Cancelled',       bg: '#333',    color: '#ccc'    },
  refunded:  { label: 'Refunded',        bg: '#333',    color: '#ccc'    },
};

export default async function CheckinPage({ params }) {
  const { token } = await params;
  const booking = await getBookingByToken(token);

  if (!booking) notFound();

  const { parent_name, parent_email, package_label, amount_cents, payment_status, checked_in_at, workshop } = booking;
  const status = STATUS_MAP[payment_status] ?? STATUS_MAP.pending;
  const isCheckedIn = !!checked_in_at;

  const checkedInTime = isCheckedIn
    ? new Date(checked_in_at).toLocaleTimeString('en-CA', {
        hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'America/Toronto',
      })
    : null;

  const formatAmount = (cents: number | null) =>
    cents != null
      ? new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(cents / 100)
      : null;

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#0a0a0f',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    }}>
      <div style={{
        background: '#111118',
        border: isCheckedIn ? '1px solid rgba(22,163,74,0.4)' : '1px solid rgba(255,255,255,0.1)',
        borderRadius: '24px',
        width: '100%',
        maxWidth: '420px',
        overflow: 'hidden',
        color: '#fff',
      }}>
        {/* Check-in status banner */}
        {isCheckedIn && (
          <div style={{ background: 'rgba(22,163,74,0.15)', borderBottom: '1px solid rgba(22,163,74,0.25)', padding: '12px 28px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#86efac' }}>
              ✓ Checked in at {checkedInTime}
            </p>
          </div>
        )}

        {/* Top section */}
        <div style={{ padding: '28px 28px 0' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#ee2435', margin: 0 }}>
            Cherry Dance Studios · Check-in
          </p>
          <p style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.03em', marginTop: 6, lineHeight: 1.1, color: '#fff' }}>
            {parent_name}
          </p>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>
            {workshop?.title ?? 'Workshop'}
          </p>
          <span style={{
            display: 'inline-block',
            marginTop: 16,
            padding: '6px 14px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            background: status.bg,
            color: status.color,
          }}>
            {status.label}
          </span>
          <hr style={{ border: 'none', borderTop: '1px dashed rgba(255,255,255,0.12)', margin: '24px 0 0' }} />
        </div>

        {/* Detail rows */}
        <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {workshop?.starts_at && (
            <Row label="Date" value={formatWorkshopDate(workshop.starts_at)} />
          )}
          {(workshop?.venue_address || workshop?.venue_name) && (
            <Row label="Venue" value={workshop.venue_address || workshop.venue_name} />
          )}
          {package_label && <Row label="Package" value={package_label} />}
          {formatAmount(amount_cents) && <Row label="Amount" value={formatAmount(amount_cents)!} />}
          <Row label="Email" value={parent_email} small />
        </div>

        {/* Check-in action */}
        <div style={{ padding: '0 28px 28px' }}>
          {isCheckedIn ? (
            <div style={{
              borderRadius: 12,
              background: 'rgba(22,163,74,0.12)',
              border: '1px solid rgba(22,163,74,0.25)',
              padding: '12px 20px',
              textAlign: 'center',
              fontSize: 13,
              color: '#86efac',
              fontWeight: 600,
            }}>
              ✓ Arrived
            </div>
          ) : (
            <form method="POST" action="/api/workshop-checkin">
              <input type="hidden" name="token" value={token} />
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #b00310 0%, #d1060f 50%, #ee2435 100%)',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                }}
              >
                Mark as arrived
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: 'center', padding: '0 28px 20px', fontSize: 11, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.08em', margin: 0 }}>
          cherrydancestudios.com
        </p>
      </div>
    </div>
  );
}

function Row({ label, value, small = false }: { label: string; value: string; small?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, fontSize: 14 }}>
      <span style={{ color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: 'right', fontSize: small ? 12 : 14 }}>{value}</span>
    </div>
  );
}

import PortalComingSoon from '../../../src/components/portal/PortalComingSoon';

export const metadata = { title: 'Fees | Cherry Dance Studios', robots: { index: false, follow: false } };

export default function Page() {
  return (
    <PortalComingSoon
      eyebrow="Portal · Fees"
      title="Your fees."
      sub="See unpaid invoices, payment history, and e-transfer details. Connecting to your fee records — back shortly."
    />
  );
}

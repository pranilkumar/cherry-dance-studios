import PortalComingSoon from '../../../src/components/portal/PortalComingSoon';

export const metadata = { title: 'My workshops | Cherry Dance Studios', robots: { index: false, follow: false } };

export default function Page() {
  return (
    <PortalComingSoon
      eyebrow="Portal · Workshops"
      title="Your workshop tickets."
      sub="All your workshop registrations with their QR check-in tickets in one place. Wiring up — back shortly."
    />
  );
}

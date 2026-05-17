import PortalComingSoon from '../../../src/components/portal/PortalComingSoon';

export const metadata = { title: 'Profile | Cherry Dance Studios', robots: { index: false, follow: false } };

export default function Page() {
  return (
    <PortalComingSoon
      eyebrow="Portal · Profile"
      title="Account & preferences."
      sub="Update your contact info, allergies, photo consent, and emergency contact. Coming next."
    />
  );
}

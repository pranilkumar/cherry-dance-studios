import PortalComingSoon from '../../../src/components/portal/PortalComingSoon';

export const metadata = { title: 'Attendance | Cherry Dance Studios', robots: { index: false, follow: false } };

export default function Page() {
  return (
    <PortalComingSoon
      eyebrow="Portal · Attendance"
      title="Attendance & streaks."
      sub="See your dancer's check-in history, attendance streak, and badges earned. Wiring up to real check-in data — back shortly."
    />
  );
}

import PortalLogin from '../../../src/components/portal/PortalLogin';

export const metadata = {
  title: 'Parent sign in | Cherry Dance Studios',
  description: 'Sign in to view your dancer\'s classes, attendance, and fees.',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PortalLogin />;
}

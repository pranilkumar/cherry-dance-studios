import PortalShell from '../../src/components/portal/PortalShell';

export const metadata = {
  title: 'Portal | Cherry Dance Studios',
  robots: { index: false, follow: false },
};

export default function PortalLayout({ children }) {
  return <PortalShell>{children}</PortalShell>;
}

import type { Metadata } from 'next';
import KioskApp from '../../src/components/attendance/KioskApp';

export const metadata: Metadata = {
  title: 'Attendance — Cherry Dance Studios',
  description: 'Class attendance kiosk',
  robots: { index: false },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CDS Attendance',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export default function AttendancePage() {
  return <KioskApp />;
}

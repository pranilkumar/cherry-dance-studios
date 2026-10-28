import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'CDS Attendance',
    short_name: 'Attendance',
    description: 'Cherry Dance Studios — class attendance kiosk',
    start_url: '/attendance',
    display: 'standalone',
    background_color: '#0a0a0f',
    theme_color: '#0a0a0f',
    orientation: 'portrait',
    icons: [
      { src: '/logo.png', sizes: '500x500', type: 'image/png', purpose: 'any' },
      { src: '/logo.png', sizes: '500x500', type: 'image/png', purpose: 'maskable' },
    ],
  };
}

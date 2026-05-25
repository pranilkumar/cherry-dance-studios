/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'img.youtube.com' },
      { protocol: 'https', hostname: 'i.ytimg.com' },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // Prevent the site from being embedded in an iframe (clickjacking).
          { key: 'X-Frame-Options',        value: 'DENY' },
          // Stop browsers from MIME-sniffing a response away from the declared type.
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          // Only send the origin in the Referer header when navigating same-origin.
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          // Disable access to sensitive browser APIs that the site doesn't use.
          { key: 'Permissions-Policy',      value: 'camera=(), microphone=(), geolocation=(), payment=()' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

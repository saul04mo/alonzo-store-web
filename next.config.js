/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Imágenes remotas (Firebase Storage, Unsplash, etc.)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
      { protocol: 'https', hostname: '*.googleusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
    ],
    unoptimized: false,
    // Solo WebP. Probamos AVIF pero codificarlo con sharp es 5-10x más
    // lento que WebP → la imagen tardaba en aparecer (alto TTFB del
    // optimizador), sobre todo la del detalle a pantalla completa y en
    // `next dev`. El ahorro de peso de AVIF vs WebP era marginal frente
    // a esa latencia. WebP ya da el gran ahorro de descarga.
    formats: ['image/webp'],
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // FIX #23: Content-Security-Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseio.com https://*.googleapis.com https://www.googletagmanager.com https://www.clarity.ms https://*.clarity.ms",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://*.googleusercontent.com https://images.unsplash.com https://*.tile.openstreetmap.org https://unpkg.com https://www.google.com https://via.placeholder.com https://www.google-analytics.com https://*.google-analytics.com https://*.clarity.ms https://c.bing.com",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebase.com https://firebasestorage.googleapis.com https://router.project-osrm.org https://nominatim.openstreetmap.org https://identitytoolkit.googleapis.com https://securetoken.googleapis.com wss://*.firebaseio.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://*.clarity.ms https://c.bing.com",
              "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

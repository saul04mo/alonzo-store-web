import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Inter, Bebas_Neue } from 'next/font/google';
import { AppShell } from '@/components/AppShell';
import { Analytics } from '@/components/Analytics';
import { Clarity } from '@/components/Clarity';
import { MetaPixel } from '@/components/MetaPixel';
import { getAnnouncements } from '@/lib/getAnnouncements';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

// Bebas Neue — sans-serif condensada estilo streetwear/fashion editorial,
// usada para títulos grandes del hero (look 'Everyday Essentials' del
// ejemplo Fear of God que el cliente pidió). Letras altas y angostas,
// sin remates, peso único 400. Se ve mejor en uppercase con tracking
// ligeramente expandido.
const bebas = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  display: 'swap',
  variable: '--font-bebas',
});

const SITE_URL = 'https://alonzocollection.com';

export const metadata: Metadata = {
  title: {
    default: 'ALONZO Store — Moda para Hombre y Mujer',
    template: '%s | ALONZO Store',
  },
  description: 'Tienda de moda urbana y streetwear. Pantalones, camisas, chaquetas y más. Envíos a toda Venezuela.',
  icons: { icon: '/icons/icon-192x192.png', apple: '/icons/icon-192x192.png' },
  manifest: '/manifest.json',
  metadataBase: new URL(SITE_URL),
  // Canónica: consolida todas las señales en alonzocollection.com y evita que
  // Google indexe dominios duplicados (p. ej. el subdominio de Netlify).
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: 'ALONZO Store',
    title: 'ALONZO Store — Moda para Hombre y Mujer',
    description: 'Tienda de moda urbana y streetwear. Pantalones, camisas, chaquetas y más. Envíos a toda Venezuela.',
    url: SITE_URL,
    images: [{ url: '/images/og-image.jpg', width: 1200, height: 630, alt: 'ALONZO Store' }],
    locale: 'es_VE',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ALONZO Store — Moda para Hombre y Mujer',
    description: 'Tienda de moda urbana y streetwear. Envíos a toda Venezuela.',
    images: ['/images/og-image.jpg'],
  },
  robots: { index: true, follow: true },
  keywords: ['moda', 'ropa', 'streetwear', 'Venezuela', 'ALONZO', 'pantalones', 'camisas', 'chaquetas', 'tienda online'],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
};

// Datos estructurados (JSON-LD) — ayudan a Google a entender que "Alonzo" es
// esta marca/tienda y a mostrar el sitio (y posibles sitelinks) por el término.
// El array `sameAs` debe incluir tus perfiles oficiales (Instagram, Facebook,
// etc.) — es una señal de marca fuerte. Rellénalo cuando los tengas.
const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'ALONZO',
      alternateName: ['Alonzo Collection', 'ALONZO Store'],
      url: SITE_URL,
      logo: `${SITE_URL}/images/logoAlonzo.png`,
      sameAs: [] as string[],
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'ALONZO',
      inLanguage: 'es-VE',
      publisher: { '@id': `${SITE_URL}/#organization` },
    },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const announcements = await getAnnouncements();

  return (
    <html lang="es" className={`${inter.variable} ${bebas.variable}`}>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        <Suspense fallback={null}>
          <Analytics />
        </Suspense>
        <Suspense fallback={null}>
          <MetaPixel />
        </Suspense>
        <Clarity />
        <AppShell announcements={announcements}>{children}</AppShell>
      </body>
    </html>
  );
}

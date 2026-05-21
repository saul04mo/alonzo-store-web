import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import { AppShell } from '@/components/AppShell';
import { getAnnouncements } from '@/lib/getAnnouncements';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

// Playfair Display — serif editorial elegante usada en el HeroBanner para
// el título grande (estilo "fashion magazine"). Solo cargamos pesos
// medios/altos porque solo se usa para títulos en mayúsculas.
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  display: 'swap',
  variable: '--font-playfair',
});

const SITE_URL = 'https://alonzo-store-web.netlify.app';

export const metadata: Metadata = {
  title: {
    default: 'ALONZO Store — Moda para Hombre y Mujer',
    template: '%s | ALONZO Store',
  },
  description: 'Tienda de moda urbana y streetwear. Pantalones, camisas, chaquetas y más. Envíos a toda Venezuela.',
  icons: { icon: '/icons/icon-192x192.png', apple: '/icons/icon-192x192.png' },
  manifest: '/manifest.json',
  metadataBase: new URL(SITE_URL),
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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const announcements = await getAnnouncements();

  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased">
        <AppShell announcements={announcements}>{children}</AppShell>
      </body>
    </html>
  );
}

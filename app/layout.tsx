import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AppShell } from '@/components/AppShell';
import './globals.css';

// FIX #25 — next/font/google en vez de <link> bloqueante
const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'ALONZO Store',
  description: 'Moda para hombre y mujer — ALONZO Store Venezuela',
  icons: { icon: '/images/letralogo.jpg', apple: '/images/letralogo.jpg' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

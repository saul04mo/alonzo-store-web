import { Suspense } from 'react';
import { HomePage } from '@/components/HomePage';
import { getServerWebSettings } from '@/lib/getServerWebSettings';

// Página dinámica: cada request lee las settings actuales (con cache
// server-side de 30s, ver lib/getServerWebSettings.ts) para que el
// primer render del HTML ya incluya la URL correcta del hero banner.
// Sin esto, el cliente arranca con DEFAULTS y la imagen real aparece
// recién cuando llega el snapshot de Firestore (~300ms después) →
// flash visible al hacer F5.
export const dynamic = 'force-dynamic';

export default async function Page() {
  const settings = await getServerWebSettings();

  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <HomePage
        initialHeroImage={settings.heroImage}
        initialHeroSubtitle={settings.heroSubtitle}
      />
    </Suspense>
  );
}

import { Suspense } from 'react';
import { HomePage } from '@/components/HomePage';
import { getServerWebSettings } from '@/lib/getServerWebSettings';
import { getCachedProducts } from '@/lib/getProducts';
import type { Gender } from '@/types';

// Página dinámica: cada request lee las settings actuales (con cache
// server-side de 30s, ver lib/getServerWebSettings.ts) para que el
// primer render del HTML ya incluya la URL correcta del hero banner.
// Sin esto, el cliente arranca con DEFAULTS y la imagen real aparece
// recién cuando llega el snapshot de Firestore (~300ms después) →
// flash visible al hacer F5.
export const dynamic = 'force-dynamic';

export default async function Page({
  searchParams,
}: {
  searchParams?: { gender?: string };
}) {
  // El store solo persiste `gender`; categoría/búsqueda arrancan vacías.
  // Tomamos el género de la URL (links compartidos) o default Hombre, y
  // bajamos su catálogo en el servidor para sembrar el render inicial.
  const initialGender: Gender = searchParams?.gender === 'Mujer' ? 'Mujer' : 'Hombre';

  const [settings, initialProducts] = await Promise.all([
    getServerWebSettings(),
    getCachedProducts(initialGender).catch(() => []),
  ]);

  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <HomePage
        initialProducts={initialProducts}
        initialGender={initialGender}
        initialHeroImages={settings.heroImages}
        initialHeroImagesMobile={settings.heroImagesMobile}
        initialHeroSubtitle={settings.heroSubtitle}
        initialHeroSlideInterval={settings.heroSlideInterval}
      />
    </Suspense>
  );
}

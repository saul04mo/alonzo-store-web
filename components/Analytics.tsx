'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getAnalyticsInstance } from '@/lib/firebase-client';

// Activa Firebase Analytics (Google Analytics 4) y registra una vista de
// página (page_view) cada vez que el usuario navega a otra ruta.
// Funciona en cualquier hosting (Netlify incluido) — Analytics es solo un
// script que corre en el navegador del visitante.
export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // measurementId vacío = Analytics deshabilitado (no rompe la app)
    if (!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) return;

    let cancelled = false;

    // Esperamos un instante antes de leer document.title: en navegación
    // cliente (sin recargar), Next.js actualiza el título DESPUÉS de cambiar
    // la ruta. Sin este delay, el page_view podría registrar el título
    // anterior en vez del nombre del producto actual.
    const timer = setTimeout(() => {
      (async () => {
        const analytics = await getAnalyticsInstance();
        if (!analytics || cancelled) return;

        const { logEvent } = await import('firebase/analytics');
        const query = searchParams.toString();
        const page_path = query ? `${pathname}?${query}` : pathname;

        logEvent(analytics, 'page_view', {
          page_path,
          page_location: window.location.href,
          page_title: document.title,
        });
      })();
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [pathname, searchParams]);

  return null;
}

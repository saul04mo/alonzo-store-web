'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { getAnalyticsInstance } from '@/lib/firebase-client';

// El catálogo por categoría vive en la MISMA ruta ("/") con query params, así
// que Next nunca cambia el <title>: sin el override de abajo, cada categoría
// que abre el visitante se reporta como una vista más de la home y la infla
// (el reporte mostraba ~4.8 vistas de home por sesión).
function titleCase(s: string): string {
  return s
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// Activa Firebase Analytics (Google Analytics 4) y registra una vista de
// página (page_view) cada vez que el usuario navega a otra ruta.
// Funciona en cualquier hosting (Netlify incluido) — Analytics es solo un
// script que corre en el navegador del visitante.
export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Última vista registrada. El sync de URL del catálogo puede re-disparar
  // este efecto con la misma URL (ver lib/useCatalogUrlState.ts); sin este
  // guard, esos re-renders se contarían como vistas separadas.
  const lastLoggedRef = useRef<string | null>(null);

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

        const query = searchParams.toString();
        const page_path = query ? `${pathname}?${query}` : pathname;

        if (lastLoggedRef.current === page_path) return;
        lastLoggedRef.current = page_path;

        // La vista de una categoría se reporta con nombre propio para poder
        // distinguirla de la home y ver qué categorías se navegan de verdad.
        const category = searchParams.get('category');
        const gender = searchParams.get('gender');
        const isCategoryView = pathname === '/' && !!category;

        const page_title = isCategoryView
          ? `Categoría: ${titleCase(category!)}${gender ? ` (${gender})` : ''} | ALONZO Store`
          : document.title;

        const { logEvent } = await import('firebase/analytics');
        logEvent(analytics, 'page_view', {
          page_path,
          page_location: window.location.href,
          page_title,
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

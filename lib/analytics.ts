'use client';

import { getAnalyticsInstance } from '@/lib/firebase-client';

/**
 * Envía un evento personalizado a Firebase Analytics (GA4).
 *
 * Para interacciones que NO son cambios de página (filtros, scroll, toggles).
 * Ojo: estas cosas no deben registrarse como `page_view` — inflarían el
 * reporte de "páginas más vistas", que es justo el problema que arreglamos
 * en components/Analytics.tsx.
 *
 * No-op si Analytics está deshabilitado (sin measurementId) o si corre en
 * el servidor. Nunca lanza: un fallo de telemetría jamás debe romper la UI.
 */
export async function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>
): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) return;

  try {
    const analytics = await getAnalyticsInstance();
    if (!analytics) return;

    const { logEvent } = await import('firebase/analytics');
    logEvent(analytics, name, params);
  } catch {
    // Silencio intencional — la telemetría no es crítica.
  }
}

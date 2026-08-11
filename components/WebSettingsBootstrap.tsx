'use client';
import { primeWebSettings } from '@/lib/useWebSettings';

/**
 * Siembra el cache de webSettings con lo que el servidor ya leyó de Firestore.
 *
 * Va montado en el layout ANTES del AppShell: React renderiza en orden de
 * árbol, así que para cuando renderizan las cards de producto el snapshot ya
 * tiene el símbolo real. Evita el parpadeo €→$ en el primer paint y, de paso,
 * que el HTML del SSR y la hidratación difieran.
 */
export function WebSettingsBootstrap({
  currencySymbol,
  whatsappNumber,
}: {
  currencySymbol: string;
  whatsappNumber: string;
}) {
  primeWebSettings({ currencySymbol, whatsappNumber });
  return null;
}

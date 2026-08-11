'use client';
import { useMemo } from 'react';
import { useWebSettings } from '@/lib/useWebSettings';

/**
 * Versión REACTIVA de `cs()` / `formatUSD()` de lib/format.ts.
 *
 * `cs()` lee el snapshot del módulo de forma síncrona: no suscribe al
 * componente. Si el componente renderiza antes de que llegue el snapshot de
 * Firestore, se queda con el símbolo de DEFAULTS para siempre — hasta que algo
 * ajeno (hover, un setState) lo obligue a re-renderizar. Eso producía la grilla
 * con precios mezclados: unas cards en € y la que tenía hover en $.
 *
 * Usar este hook en todo lo que pinte precios en el render.
 * `cs()` / `formatUSD()` de lib/format.ts siguen sirviendo para código que
 * corre fuera del render (handlers, armado del mensaje de WhatsApp), donde el
 * snapshot ya está cargado.
 */
export function useMoney() {
  const { currencySymbol } = useWebSettings();

  return useMemo(
    () => ({
      currencySymbol,
      /** Mismo shape que `cs()` para que los call sites no cambien. */
      cs: () => currencySymbol,
      formatUSD: (amount: number) => `${currencySymbol} ${amount.toFixed(2)}`,
    }),
    [currencySymbol],
  );
}

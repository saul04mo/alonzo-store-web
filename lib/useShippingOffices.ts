'use client';

import { useEffect, useState } from 'react';
import type { ShippingAgencyOffices } from '@/types';

// Caché a nivel de módulo: se descarga UNA vez por sesión y se comparte entre
// montajes del checkout (las oficinas casi nunca cambian).
let cached: ShippingAgencyOffices[] | null = null;
let inflight: Promise<ShippingAgencyOffices[]> | null = null;

async function load(): Promise<ShippingAgencyOffices[]> {
  if (cached) return cached;
  if (!inflight) {
    inflight = fetch('/api/shipping-offices')
      .then((r) => r.json())
      .then((d) => {
        cached = d?.agencies ?? [];
        return cached!;
      })
      .catch(() => {
        inflight = null; // permite reintentar en el próximo montaje
        return [];
      });
  }
  return inflight;
}

/**
 * Carga (perezosa) las oficinas de envío nacional agrupadas por agencia.
 * Pásale `enabled=false` mientras el cliente no haya elegido envío nacional
 * para no pedir la data hasta que haga falta.
 */
export function useShippingOffices(enabled: boolean) {
  const [agencies, setAgencies] = useState<ShippingAgencyOffices[]>(cached ?? []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || cached) return;
    let alive = true;
    setLoading(true);
    load().then((data) => {
      if (!alive) return;
      setAgencies(data);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [enabled]);

  return { agencies, loading };
}

'use client';

import { useState, useEffect } from 'react';
import { useClientStore } from '@/stores';
import type { Client } from '@/types';

/**
 * Cliente del store + flag `hydrated`.
 *
 * El clientStore se persiste en localStorage, pero Zustand lo rehidrata
 * en el cliente *después* del primer render. Si una página de cuenta lee
 * `client` en ese primer render lo ve `null` y —si redirige -> /account o
 * muestra "inicia sesión"— expulsa al usuario logueado antes de tiempo.
 *
 * `hydrated` se vuelve true tras montar (cuando localStorage ya fue leído),
 * así las páginas esperan ese momento antes de decidir "no hay cliente".
 */
export function useHydratedClient(): { client: Client | null; hydrated: boolean } {
  const client = useClientStore((s) => s.client);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return { client, hydrated };
}

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Client } from '@/types';

interface ClientState {
  client: Client | null;
  setClient: (client: Client) => void;
  clearClient: () => void;
}

export const useClientStore = create<ClientState>()(
  persist(
    (set) => ({
      client: null,
      setClient: (client) => set({ client }),
      clearClient: () => set({ client: null }),
    }),
    { name: 'alonzoUser' }
  )
);

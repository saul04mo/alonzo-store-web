'use client';

import { create } from 'zustand';

interface ConfigState {
  exchangeRate: number;
  setExchangeRate: (rate: number) => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
  exchangeRate: 1,
  setExchangeRate: (rate) => set({ exchangeRate: rate }),
}));

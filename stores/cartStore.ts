'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types';

const CART_TTL_MS = 24 * 60 * 60 * 1000;

interface CartState {
  items: CartItem[];
  lastUpdated: number;
  addItem: (item: CartItem) => void;
  updateQty: (index: number, delta: number) => void;
  removeItem: (index: number) => void;
  clear: () => void;
  totalItems: () => number;
  totalMoney: () => number;
  isExpired: () => boolean;
  checkExpiry: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      lastUpdated: Date.now(),
      addItem: (newItem) =>
        set((state) => {
          const existing = state.items.findIndex((i) => i.key === newItem.key);
          if (existing >= 0) {
            const updated = [...state.items];
            if (updated[existing].qty >= 99) return state;
            updated[existing] = { ...updated[existing], qty: updated[existing].qty + 1 };
            return { items: updated, lastUpdated: Date.now() };
          }
          return { items: [...state.items, newItem], lastUpdated: Date.now() };
        }),
      updateQty: (index, delta) =>
        set((state) => {
          const updated = [...state.items];
          const newQty = updated[index].qty + delta;
          if (newQty > 99) return state;
          updated[index] = { ...updated[index], qty: newQty };
          if (updated[index].qty < 1) updated.splice(index, 1);
          return { items: updated, lastUpdated: Date.now() };
        }),
      removeItem: (index) =>
        set((state) => {
          const updated = [...state.items];
          updated.splice(index, 1);
          return { items: updated, lastUpdated: Date.now() };
        }),
      clear: () => set({ items: [], lastUpdated: Date.now() }),
      totalItems: () => get().items.reduce((acc, item) => acc + item.qty, 0),
      totalMoney: () => get().items.reduce((acc, item) => acc + parseFloat(item.precio) * item.qty, 0),
      isExpired: () => Date.now() - get().lastUpdated > CART_TTL_MS,
      checkExpiry: () => {
        if (get().isExpired() && get().items.length > 0) {
          set({ items: [], lastUpdated: Date.now() });
        }
      },
    }),
    { name: 'alonzoCart' }
  )
);

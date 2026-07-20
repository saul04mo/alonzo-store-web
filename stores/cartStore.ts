'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types';
import { gaAddToCart, gaRemoveFromCart } from '@/lib/analytics';

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
      addItem: (newItem) => {
        let addedQty = 0; // unidades que realmente entraron (0 si topó el 99)
        set((state) => {
          const existing = state.items.findIndex((i) => i.key === newItem.key);
          if (existing >= 0) {
            const updated = [...state.items];
            if (updated[existing].qty >= 99) return state;
            updated[existing] = { ...updated[existing], qty: updated[existing].qty + 1 };
            addedQty = 1; // ítem repetido: este flujo suma de a 1
            return { items: updated, lastUpdated: Date.now() };
          }
          addedQty = newItem.qty; // ítem nuevo: entra con su cantidad completa
          return { items: [...state.items, newItem], lastUpdated: Date.now() };
        });
        // GA4 add_to_cart — con las unidades que agregó realmente este clic.
        if (addedQty > 0) gaAddToCart({ ...newItem, qty: addedQty });
      },
      updateQty: (index, delta) => {
        const before = get().items[index];
        if (!before) return;
        if (before.qty + delta > 99) return;
        set((state) => {
          const updated = [...state.items];
          updated[index] = { ...updated[index], qty: updated[index].qty + delta };
          if (updated[index].qty < 1) updated.splice(index, 1);
          return { items: updated, lastUpdated: Date.now() };
        });
        // Los +/- del carrito son micro add/remove de 1 unidad para GA4.
        if (delta > 0) gaAddToCart({ ...before, qty: delta });
        else if (delta < 0) gaRemoveFromCart({ ...before, qty: -delta });
      },
      removeItem: (index) => {
        const removed = get().items[index];
        set((state) => {
          const updated = [...state.items];
          updated.splice(index, 1);
          return { items: updated, lastUpdated: Date.now() };
        });
        // GA4 remove_from_cart — con la cantidad completa que tenía la línea.
        if (removed) gaRemoveFromCart(removed);
      },
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

'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Gender } from '@/types';

interface UIState {
  gender: Gender;
  searchTerm: string;
  activeCategory: string;
  categoriesByGender: Record<string, string[]>;
  hasBrowsed: boolean;
  setGender: (g: Gender) => void;
  setSearchTerm: (term: string) => void;
  setActiveCategory: (cat: string) => void;
  setCategoriesForGender: (gender: string, cats: string[]) => void;
  setHasBrowsed: (browsed: boolean) => void;
  authOpen: boolean;
  setAuthOpen: (open: boolean) => void;
  cartDrawerOpen: boolean;
  setCartDrawerOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      gender: 'Hombre',
      searchTerm: '',
      activeCategory: '',
      categoriesByGender: {},
      hasBrowsed: false,
      setGender: (gender) => set({ gender, activeCategory: '' }),
      setSearchTerm: (searchTerm) => set({ searchTerm }),
      setActiveCategory: (activeCategory) => set({ activeCategory }),
      setCategoriesForGender: (gender, cats) =>
        set((s) => ({ categoriesByGender: { ...s.categoriesByGender, [gender]: cats } })),
      setHasBrowsed: (hasBrowsed) => set({ hasBrowsed }),
      authOpen: false,
      setAuthOpen: (authOpen) => set({ authOpen }),
      cartDrawerOpen: false,
      setCartDrawerOpen: (cartDrawerOpen) => set({ cartDrawerOpen }),
    }),
    {
      name: 'alonzoUI',
      partialize: (state) => ({
        gender: state.gender,
        hasBrowsed: state.hasBrowsed,
      }),
    }
  )
);
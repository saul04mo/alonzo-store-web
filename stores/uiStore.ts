'use client';

import { create } from 'zustand';
import type { Gender } from '@/types';

interface UIState {
  gender: Gender;
  searchTerm: string;
  activeCategory: string;
  categoriesByGender: Record<string, string[]>;
  setGender: (g: Gender) => void;
  setSearchTerm: (term: string) => void;
  setActiveCategory: (cat: string) => void;
  setCategoriesForGender: (gender: string, cats: string[]) => void;
}

export const useUIStore = create<UIState>((set) => ({
  gender: 'Hombre',
  searchTerm: '',
  activeCategory: '',
  categoriesByGender: {},
  setGender: (gender) => set({ gender, activeCategory: '' }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
  setActiveCategory: (activeCategory) => set({ activeCategory }),
  setCategoriesForGender: (gender, cats) =>
    set((s) => ({ categoriesByGender: { ...s.categoriesByGender, [gender]: cats } })),
}));
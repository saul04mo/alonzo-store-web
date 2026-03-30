'use client';

import { create } from 'zustand';
import type { Gender } from '@/types';

interface UIState {
  gender: Gender;
  searchTerm: string;
  setGender: (g: Gender) => void;
  setSearchTerm: (term: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  gender: 'Hombre',
  searchTerm: '',
  setGender: (gender) => set({ gender }),
  setSearchTerm: (searchTerm) => set({ searchTerm }),
}));

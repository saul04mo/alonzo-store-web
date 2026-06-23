'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUIStore } from '@/stores';
import type { Gender } from '@/types';

/**
 * Sincroniza el estado de navegación del catálogo (gender / activeCategory
 * / hasBrowsed) con los query params de la URL, en ambos sentidos.
 *
 * Lógica movida verbatim desde HomePage — incluye los dos guards sutiles
 * que arreglaban bugs reales:
 *  - El skip del primer run del efecto URL→push (sin él se perdían los
 *    params al entrar por un link compartido).
 *  - Las deps acotadas a [searchParams] en el sync inverso (intencional).
 *
 * Devuelve `mounted` para que HomePage evite el render en SSR (la home
 * depende de estado persistido en el cliente).
 */
export function useCatalogUrlState(): { mounted: boolean } {
  const router = useRouter();
  const searchParams = useSearchParams();

  const gender = useUIStore((s) => s.gender);
  const setGender = useUIStore((s) => s.setGender);
  const activeCategory = useUIStore((s) => s.activeCategory);
  const setActiveCategory = useUIStore((s) => s.setActiveCategory);
  const hasBrowsed = useUIStore((s) => s.hasBrowsed);
  const setHasBrowsed = useUIStore((s) => s.setHasBrowsed);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Sync state from URL (on mount + back/forward navigation)
  useEffect(() => {
    const urlGender = searchParams.get('gender');
    const urlCategory = searchParams.get('category');
    if (urlGender === 'Mujer' || urlGender === 'Hombre') {
      if (urlGender !== gender) setGender(urlGender as Gender);
    }
    if (urlCategory) {
      // Guardamos la categoría tal como viene en la URL — la validación
      // contra las categorías reales del catálogo ocurre en HomePage
      // (isCategoryNotFound), una vez que los productos cargaron.
      const cat = urlCategory.trim().toUpperCase();
      if (cat !== activeCategory) setActiveCategory(cat);
      if (!hasBrowsed) setHasBrowsed(true);
    } else if (hasBrowsed && !urlCategory) {
      setHasBrowsed(false);
      setActiveCategory('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Update URL when category changes.
  // Skip the first run after mount: en ese momento URL sync aún no propagó
  // sus setters, así que el closure tiene hasBrowsed=false aunque la URL
  // sí traiga ?category=... Sin este guard se llamaba router.push('/') y
  // se perdían los params al entrar directo con un link compartido.
  const urlUpdateInitializedRef = useRef(false);
  useEffect(() => {
    if (!mounted) return;
    if (!urlUpdateInitializedRef.current) {
      urlUpdateInitializedRef.current = true;
      return;
    }
    const params = new URLSearchParams();
    if (hasBrowsed && activeCategory) {
      params.set('gender', gender);
      params.set('category', activeCategory);
      const newUrl = `/?${params.toString()}`;
      // Only push if URL actually changed
      if (window.location.search !== `?${params.toString()}`) {
        router.push(newUrl, { scroll: false });
      }
    } else if (!hasBrowsed && window.location.search) {
      router.push('/', { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, hasBrowsed, gender, mounted]);

  return { mounted };
}

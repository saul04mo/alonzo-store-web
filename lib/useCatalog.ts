'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { fetchProducts, seedProducts } from '@/lib/api';
import { computeCategories } from '@/lib/categories';
import { useUIStore } from '@/stores';
import type { Product, Gender } from '@/types';

/**
 * Maneja la carga del catálogo de la home: productos del género activo,
 * estado de loading, y la lista derivada de categorías. También siembra el
 * cache cliente con los productos que bajó el servidor y mantiene
 * sincronizada la lista de categorías del store (para el menú del header).
 *
 * Lógica movida verbatim desde HomePage, incluyendo el fix de race
 * condition (flag `cancelled`) al cambiar de género.
 */
export function useCatalog(
  initialProducts: Product[],
  initialGender: Gender
): { products: Product[]; loading: boolean; categories: string[] } {
  const gender = useUIStore((s) => s.gender);
  const activeCategory = useUIStore((s) => s.activeCategory);
  const setActiveCategory = useUIStore((s) => s.setActiveCategory);
  const setCategoriesForGender = useUIStore((s) => s.setCategoriesForGender);

  // Sembramos el cache cliente con los productos que bajó el servidor —
  // así el primer fetchProducts() devuelve al instante (sin round-trip a
  // Netlify). Guarded por ref para correr una sola vez.
  const seededRef = useRef(false);
  if (!seededRef.current && initialProducts.length > 0) {
    seedProducts(initialGender, initialProducts);
    seededRef.current = true;
  }

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);

  // Load products — race-safe con flag 'cancelled' para evitar que un
  // fetch viejo pise el state si gender cambió mientras estaba en curso.
  useEffect(() => {
    let cancelled = false;
    // Si ya tenemos productos del género actual (seed del servidor o cache
    // caliente), no parpadeamos a skeleton: refrescamos en background.
    const haveCurrentGender = products.length > 0 && products[0]?.gender === gender;
    if (!haveCurrentGender) {
      setLoading(true);
      setProducts([]);
    }
    fetchProducts(gender)
      .then((data) => {
        if (cancelled) return;
        setProducts(data);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // products se lee a propósito sin estar en deps: solo queremos
    // re-ejecutar al cambiar gender, usando el snapshot actual.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gender]);

  // Categories (lógica compartida en lib/categories.ts)
  const categories = useMemo(() => computeCategories(products, gender), [products, gender]);

  // Store categories in UI store for the header nav.
  // Solo actualizamos cuando los productos ya son del género actual —
  // evita que en el render intermedio (gender cambió pero products
  // todavía tiene datos del género anterior) se guarden categorías
  // del género equivocado bajo la nueva clave.
  useEffect(() => {
    if (categories.length > 0 && products.length > 0 && products[0].gender === gender) {
      setCategoriesForGender(gender, categories);
    }
  }, [categories, gender, products, setCategoriesForGender]);

  // Auto-select first category
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory, setActiveCategory]);

  return { products, loading, categories };
}

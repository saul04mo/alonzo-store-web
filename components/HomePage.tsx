'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { HeroSection } from '@/components/ui';
import { ProductGrid } from '@/components/products/ProductGrid';
import { fetchProducts } from '@/lib/api';
import { hombreCategoryOrder } from '@/config';
import { useUIStore } from '@/stores';
import type { Product, Gender } from '@/types';

export function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const gender = useUIStore((s) => s.gender);
  const setGender = useUIStore((s) => s.setGender);
  const searchTerm = useUIStore((s) => s.searchTerm);
  const setSearchTerm = useUIStore((s) => s.setSearchTerm);
  const activeCategory = useUIStore((s) => s.activeCategory);
  const setActiveCategory = useUIStore((s) => s.setActiveCategory);
  const setCategoriesForGender = useUIStore((s) => s.setCategoriesForGender);
  const [hasBrowsed, setHasBrowsed] = useState(false);

  // Load products
  useEffect(() => {
    setLoading(true);
    setProducts([]);
    setActiveCategory('');
    setHasBrowsed(true);
    fetchProducts(gender)
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [gender]);

  // Categories
  const categories = useMemo(() => {
    const unique = new Set<string>();
    products.forEach((p) => {
      const cat = p.category.trim().toUpperCase();
      if (cat && cat !== 'EXTRAS') unique.add(cat);
    });
    const arr = Array.from(unique);
    if (gender === 'Mujer') {
      arr.sort((a, b) => b.localeCompare(a));
    } else {
      arr.sort((a, b) => {
        const wA = hombreCategoryOrder[a] || 99;
        const wB = hombreCategoryOrder[b] || 99;
        return wA !== wB ? wA - wB : a.localeCompare(b);
      });
    }
    return arr;
  }, [products, gender]);

  // Store categories in UI store for the header nav
  useEffect(() => {
    if (categories.length > 0) {
      setCategoriesForGender(gender, categories);
    }
  }, [categories, gender]);

  // Auto-select first category
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  // Filtered
  const filteredProducts = useMemo(() => {
    if (searchTerm.trim()) {
      const term = searchTerm.toUpperCase();
      return products.filter((p) => p.name.toUpperCase().includes(term));
    }
    if (activeCategory) {
      const filtered = products.filter((p) => p.category.trim().toUpperCase() === activeCategory);
      if (filtered.length > 0) return filtered;
    }
    return products;
  }, [products, activeCategory, searchTerm]);

  const genderLabel = gender === 'Mujer' ? 'Moda para mujer' : 'Moda para hombre';
  const showHero = !hasBrowsed && !searchTerm;

  const handleGenderFromHero = useCallback((g: Gender) => {
    setGender(g);
    setHasBrowsed(true);
    setActiveCategory('');
  }, []);

  const handleProductClick = useCallback(
    (product: Product) => router.push(`/product/${product.id}`),
    [router]
  );

  if (showHero) {
    return (
      <>
        <HeroSection onGenderChange={handleGenderFromHero} />
        <div className="max-w-[1400px] mx-auto px-4 md:px-10">
          <div className="h-px bg-alonzo-gray-200 my-4" />
        </div>
        <div className="py-6 md:py-10">
          <ProductGrid
            products={filteredProducts.slice(0, 8)}
            loading={loading}
            onProductClick={handleProductClick}
            sectionTitle={genderLabel}
          />
        </div>
      </>
    );
  }

  return (
    <div className="py-6 md:py-10">
      <ProductGrid
        products={filteredProducts}
        loading={loading}
        onProductClick={handleProductClick}
        sectionTitle={searchTerm ? `Resultados para "${searchTerm}"` : genderLabel}
      />
    </div>
  );
}
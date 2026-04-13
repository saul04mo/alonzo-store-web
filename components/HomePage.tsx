'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProductGrid } from '@/components/products/ProductGrid';
import { PromotionsBanner } from '@/components/products/PromotionsBanner';
import { HeroBanner } from '@/components/ui';
import { fetchProducts, seedProduct } from '@/lib/api';
import { hombreCategoryOrder, categoryDescriptions } from '@/config';
import { useUIStore } from '@/stores';
import { SlidersHorizontal } from 'lucide-react';
import type { Product, Gender } from '@/types';

type GridCols = 2 | 3 | 4;

export function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [gridCols, setGridCols] = useState<GridCols>(4);
  const gender = useUIStore((s) => s.gender);
  const setGender = useUIStore((s) => s.setGender);
  const searchTerm = useUIStore((s) => s.searchTerm);
  const setSearchTerm = useUIStore((s) => s.setSearchTerm);
  const activeCategory = useUIStore((s) => s.activeCategory);
  const setActiveCategory = useUIStore((s) => s.setActiveCategory);
  const setCategoriesForGender = useUIStore((s) => s.setCategoriesForGender);
  const hasBrowsed = useUIStore((s) => s.hasBrowsed);
  const setHasBrowsed = useUIStore((s) => s.setHasBrowsed);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Load products
  useEffect(() => {
    setLoading(true);
    setProducts([]);
    setActiveCategory('');
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

  const handleProductClick = useCallback(
    (product: Product) => {
      seedProduct(product);
      router.push(`/product/${product.id}`);
    },
    [router]
  );

  // Category display name (capitalize first letter of each word)
  const categoryDisplayName = useMemo(() => {
    if (!activeCategory) return '';
    return activeCategory
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }, [activeCategory]);

  const categoryDescription = categoryDescriptions[activeCategory] || '';
  const showHero = !hasBrowsed && !searchTerm;

  if (!mounted) return <div className="min-h-screen bg-white" />;

  return (
    <>
      {showHero && <HeroBanner />}

      <div id="products-section" className={`${hasBrowsed ? 'py-4 md:py-6' : 'py-6 md:py-10'}`}>
        {/* Category header (shown when browsing a category) */}
        {hasBrowsed && activeCategory && !searchTerm && (
          <div className="px-4 md:px-6 lg:px-10 mb-8 md:mb-12 pt-6 md:pt-10">
            {/* Title + count */}
            <h1 className="text-2xl md:text-3xl font-semibold text-alonzo-charcoal tracking-wide mb-4 md:mb-5">
              {categoryDisplayName}
              <span className="text-alonzo-gray-400 font-normal text-lg md:text-xl ml-3">
                {filteredProducts.length}
              </span>
            </h1>

            {/* Description */}
            {categoryDescription && (
              <p className="text-sm text-alonzo-gray-500 max-w-2xl mb-8 md:mb-10 leading-relaxed">
                {categoryDescription}
              </p>
            )}

            {/* View toggle + Filter */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-alonzo-gray-500 mr-1">View</span>
                <button
                  onClick={() => setGridCols(2)}
                  className={`p-1.5 rounded transition-colors ${gridCols === 2 ? 'text-alonzo-black' : 'text-alonzo-gray-300 hover:text-alonzo-gray-600'}`}
                  title="2 columnas"
                >
                  <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
                    <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
                  </svg>
                </button>
                <button
                  onClick={() => setGridCols(3)}
                  className={`p-1.5 rounded transition-colors hidden sm:flex ${gridCols === 3 ? 'text-alonzo-black' : 'text-alonzo-gray-300 hover:text-alonzo-gray-600'}`}
                  title="3 columnas"
                >
                  <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="1" y="1" width="4" height="6" rx="0.5"/><rect x="6" y="1" width="4" height="6" rx="0.5"/><rect x="11" y="1" width="4" height="6" rx="0.5"/>
                    <rect x="1" y="9" width="4" height="6" rx="0.5"/><rect x="6" y="9" width="4" height="6" rx="0.5"/><rect x="11" y="9" width="4" height="6" rx="0.5"/>
                  </svg>
                </button>
                <button
                  onClick={() => setGridCols(4)}
                  className={`p-1.5 rounded transition-colors hidden md:flex ${gridCols === 4 ? 'text-alonzo-black' : 'text-alonzo-gray-300 hover:text-alonzo-gray-600'}`}
                  title="4 columnas"
                >
                  <svg width="22" height="22" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="1" y="1" width="3" height="3" rx="0.5"/><rect x="5.5" y="1" width="3" height="3" rx="0.5"/>
                    <rect x="10" y="1" width="3" height="3" rx="0.5"/><rect x="1" y="5.5" width="3" height="3" rx="0.5"/>
                    <rect x="5.5" y="5.5" width="3" height="3" rx="0.5"/><rect x="10" y="5.5" width="3" height="3" rx="0.5"/>
                    <rect x="1" y="10" width="3" height="3" rx="0.5"/><rect x="5.5" y="10" width="3" height="3" rx="0.5"/>
                    <rect x="10" y="10" width="3" height="3" rx="0.5"/>
                  </svg>
                </button>
              </div>
              <button className="flex items-center gap-2 text-sm text-alonzo-gray-600 hover:text-alonzo-black transition-colors">
                <span>Filter</span>
                <SlidersHorizontal size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Search results title */}
        {searchTerm && (
          <div className="px-4 md:px-6 lg:px-8 mb-6">
            <h1 className="text-lg font-semibold text-alonzo-charcoal">
              Resultados para "{searchTerm}"
              <span className="text-alonzo-gray-400 font-normal text-sm ml-2">{filteredProducts.length}</span>
            </h1>
          </div>
        )}

        <PromotionsBanner />
        <ProductGrid
          products={filteredProducts}
          loading={loading}
          onProductClick={handleProductClick}
          sectionTitle={!hasBrowsed && !searchTerm ? (gender === 'Mujer' ? 'Moda para mujer' : 'Moda para hombre') : undefined}
          gridCols={hasBrowsed ? gridCols : undefined}
        />
      </div>
    </>
  );
}

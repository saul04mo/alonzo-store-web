'use client';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fetchProducts, seedProduct } from '@/lib/api';
import { productHref } from '@/lib/productUrl';
import { useUIStore } from '@/stores';
import { ProductCard } from '@/components/products/ProductCard';
import type { Product, Gender } from '@/types';

export function SearchPage() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [genderFilter, setGenderFilter] = useState<Gender | null>(null);

  const gender = useUIStore((s) => s.gender);

  // Load all products
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [h, m] = await Promise.all([
          fetchProducts('Hombre'),
          fetchProducts('Mujer'),
        ]);
        if (!cancelled) {
          const map = new Map<string, Product>();
          [...h, ...m].forEach((p) => map.set(p.id, p));
          setAllProducts(Array.from(map.values()));
        }
      } catch { /* fail silently */ }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  // Autofocus
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 150);
  }, []);

  // Filter results
  const results = useMemo(() => {
    let filtered = allProducts;

    // Gender filter
    if (genderFilter) {
      filtered = filtered.filter((p) => p.gender === genderFilter);
    }

    // Search term
    if (query.trim()) {
      const term = query.toUpperCase();
      filtered = filtered.filter((p) =>
        p.name.toUpperCase().includes(term) ||
        p.category.toUpperCase().includes(term)
      );
    }

    return filtered;
  }, [query, allProducts, genderFilter]);

  const handleProductClick = useCallback((product: Product) => {
    seedProduct(product);
    router.push(productHref(product));
  }, [router]);

  const handleClose = () => {
    router.back();
  };

  const handleClear = () => {
    setQuery('');
    setGenderFilter(null);
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* ── Search bar ── */}
      <div className="sticky top-0 z-50 bg-white border-b border-alonzo-gray-200">
        <div className="flex items-center h-14 px-4 md:px-8 max-w-[1600px] mx-auto">
          <svg
            className="w-5 h-5 text-alonzo-gray-400 shrink-0 mr-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar..."
            className="flex-1 text-sm md:text-base text-alonzo-charcoal placeholder:text-alonzo-gray-400 outline-none tracking-wide bg-transparent"
          />
          <div className="flex items-center gap-4 shrink-0">
            {(query || genderFilter) && (
              <button
                onClick={handleClear}
                className="text-[11px] tracking-[0.1em] uppercase text-alonzo-gray-500 hover:text-alonzo-black transition-colors"
              >
                limpiar
              </button>
            )}
            <button
              onClick={handleClose}
              className="text-alonzo-gray-500 hover:text-alonzo-black transition-colors"
            >
              <X size={20} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="max-w-[1600px] mx-auto flex">
        {/* ── Left sidebar ── */}
        <aside className="hidden md:block w-[220px] shrink-0 px-6 py-8 border-r border-alonzo-gray-200 sticky top-14 h-[calc(100vh-56px)] overflow-y-auto">
          {/* Gender filter */}
          <div className="mb-8">
            {(['Hombre', 'Mujer'] as Gender[]).map((g) => (
              <button
                key={g}
                onClick={() => setGenderFilter(genderFilter === g ? null : g)}
                className="flex items-center gap-2.5 py-1.5 w-full text-left group"
              >
                <span className={`w-3.5 h-3.5 border transition-colors ${
                  genderFilter === g
                    ? 'bg-alonzo-black border-alonzo-black'
                    : 'border-alonzo-gray-400 group-hover:border-alonzo-black'
                }`} />
                <span className={`text-[12px] tracking-[0.12em] uppercase font-medium transition-colors ${
                  genderFilter === g ? 'text-alonzo-black' : 'text-alonzo-gray-600 group-hover:text-alonzo-black'
                }`}>
                  {g === 'Hombre' ? 'Hombre' : 'Mujer'}
                </span>
              </button>
            ))}
          </div>
        </aside>

        {/* ── Mobile filters (horizontal) ── */}
        <div className="md:hidden w-full">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-alonzo-gray-200 overflow-x-auto">
            {(['Hombre', 'Mujer'] as Gender[]).map((g) => (
              <button
                key={g}
                onClick={() => setGenderFilter(genderFilter === g ? null : g)}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-sm text-[11px] tracking-[0.1em] uppercase font-medium shrink-0 transition-colors ${
                  genderFilter === g
                    ? 'bg-alonzo-black text-white border-alonzo-black'
                    : 'border-alonzo-gray-300 text-alonzo-gray-600'
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Results grid (mobile) */}
          <div className="px-3 py-4">
            {loading ? (
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i}>
                    <div className="w-full pt-[125%] skeleton-shimmer rounded-sm" />
                    <div className="h-3 w-2/3 skeleton-shimmer rounded mt-2" />
                    <div className="h-3 w-1/4 skeleton-shimmer rounded mt-1" />
                  </div>
                ))}
              </div>
            ) : results.length > 0 ? (
              <>
                <p className="text-[10px] tracking-[0.12em] uppercase text-alonzo-gray-400 mb-3">
                  {results.length} producto{results.length !== 1 ? 's' : ''}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {results.map((p, idx) => (
                    <div key={p.id} className={idx < 8 ? `stagger-up stagger-${idx + 1}` : 'page-fade-soft'}>
                      <ProductCard
                        product={p}
                        onClick={() => handleProductClick(p)}
                      />
                    </div>
                  ))}
                </div>
              </>
            ) : query.trim() ? (
              <div className="text-center py-16">
                <p className="text-sm text-alonzo-gray-500">
                  No se encontraron resultados para "{query}"
                </p>
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-sm text-alonzo-gray-400">
                  Escribe para buscar productos
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ── Product grid (desktop) ── */}
        <div className="hidden md:block flex-1 px-6 py-6">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i}>
                  <div className="w-full pt-[125%] skeleton-shimmer rounded-sm" />
                  <div className="h-3 w-2/3 skeleton-shimmer rounded mt-2" />
                  <div className="h-3 w-1/4 skeleton-shimmer rounded mt-1" />
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <>
              <p className="text-[10px] tracking-[0.12em] uppercase text-alonzo-gray-400 mb-4">
                {results.length} producto{results.length !== 1 ? 's' : ''}
              </p>
              <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {results.map((p, idx) => (
                  <div key={p.id} className={idx < 8 ? `stagger-up stagger-${idx + 1}` : 'page-fade-soft'}>
                    <ProductCard
                      product={p}
                      onClick={() => handleProductClick(p)}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : query.trim() ? (
            <div className="text-center py-24">
              <p className="text-sm text-alonzo-gray-500">
                No se encontraron resultados para "{query}"
              </p>
              <p className="text-[11px] text-alonzo-gray-400 mt-2">
                Intenta con otro término o filtra por género
              </p>
            </div>
          ) : (
            <div className="text-center py-24">
              <p className="text-sm text-alonzo-gray-400">
                Escribe para buscar productos
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

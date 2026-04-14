'use client';
import { useState, useEffect, useRef, useMemo } from 'react';
import { X, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { fetchProducts, seedProduct } from '@/lib/api';
import { useUIStore } from '@/stores';
import type { Product } from '@/types';

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const setSearchTerm = useUIStore((s) => s.setSearchTerm);
  const setHasBrowsed = useUIStore((s) => s.setHasBrowsed);

  // Load products on open
  useEffect(() => {
    if (!open) return;
    setQuery('');
    let cancelled = false;
    (async () => {
      try {
        const [h, m] = await Promise.all([
          fetchProducts('Hombre'),
          fetchProducts('Mujer'),
        ]);
        if (!cancelled) {
          // Deduplicate by id
          const map = new Map<string, Product>();
          [...h, ...m].forEach((p) => map.set(p.id, p));
          setAllProducts(Array.from(map.values()));
        }
      } catch { /* products already cached, fail silently */ }
    })();
    return () => { cancelled = true; };
  }, [open]);

  // Autofocus
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  // Filter results
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const term = query.toUpperCase();
    return allProducts
      .filter((p) =>
        p.name.toUpperCase().includes(term) ||
        p.category.toUpperCase().includes(term)
      )
      .slice(0, 8);
  }, [query, allProducts]);

  const handleSelect = (product: Product) => {
    seedProduct(product);
    router.push(`/product/${product.id}`);
    onClose();
    setQuery('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    // Navigate to home and set search term for full results
    setSearchTerm(query.trim());
    setHasBrowsed(true);
    router.push('/');
    onClose();
    setQuery('');
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[200] animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 left-0 right-0 z-[201] bg-white shadow-lg search-slide-down">
        <div className="max-w-[900px] mx-auto px-5 py-6 md:py-8">
          {/* Input row */}
          <form onSubmit={handleSubmit} className="flex items-center gap-4">
            <Search size={20} strokeWidth={1.5} className="text-alonzo-gray-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar productos..."
              className="flex-1 text-base md:text-lg text-alonzo-charcoal placeholder:text-alonzo-gray-400 outline-none tracking-wide bg-transparent"
            />
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 text-alonzo-gray-500 hover:text-alonzo-black transition-colors"
            >
              <X size={22} strokeWidth={1.5} />
            </button>
          </form>

          {/* Results */}
          {query.trim() && (
            <div className="mt-6 border-t border-alonzo-gray-200 pt-4">
              {results.length > 0 ? (
                <>
                  <p className="text-[10px] tracking-[0.15em] uppercase text-alonzo-gray-400 mb-4">
                    {results.length} resultado{results.length !== 1 ? 's' : ''}
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-[50vh] overflow-y-auto">
                    {results.map((p) => {
                      const hasOffer = p.offer && p.offer.value > 0;
                      const price = parseFloat(p.variants[0]?.price || p.price || '0');
                      const finalPrice = hasOffer
                        ? p.offer!.type === 'percentage'
                          ? price - (price * p.offer!.value / 100)
                          : Math.max(0, price - p.offer!.value)
                        : price;

                      return (
                        <button
                          key={p.id}
                          onClick={() => handleSelect(p)}
                          className="text-left group"
                        >
                          <div className="aspect-[3/4] bg-alonzo-gray-100 rounded-sm overflow-hidden mb-2">
                            <img
                              src={p.imageUrl}
                              alt={p.name}
                              className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <p className="text-[11px] text-alonzo-charcoal truncate tracking-wide">
                            {p.name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {hasOffer && (
                              <span className="text-[10px] text-alonzo-gray-400 line-through">
                                €{price.toFixed(2)}
                              </span>
                            )}
                            <span className={`text-[11px] font-medium ${hasOffer ? 'text-red-600' : 'text-alonzo-charcoal'}`}>
                              €{finalPrice.toFixed(2)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {results.length >= 8 && (
                    <button
                      onClick={handleSubmit}
                      className="mt-4 text-[11px] tracking-[0.1em] uppercase underline underline-offset-2 text-alonzo-gray-600 hover:text-alonzo-black transition-colors"
                    >
                      Ver todos los resultados
                    </button>
                  )}
                </>
              ) : (
                <p className="text-sm text-alonzo-gray-500 py-4 text-center">
                  No se encontraron productos para "{query}"
                </p>
              )}
            </div>
          )}

          {/* Suggestions when empty */}
          {!query.trim() && (
            <div className="mt-6 border-t border-alonzo-gray-200 pt-4">
              <p className="text-[10px] tracking-[0.15em] uppercase text-alonzo-gray-400 mb-3">
                Búsquedas populares
              </p>
              <div className="flex flex-wrap gap-2">
                {['Pantalones', 'Camisas', 'Chaquetas', 'Conjuntos', 'Básicos'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setQuery(tag)}
                    className="px-3 py-1.5 border border-alonzo-gray-300 text-[11px] tracking-[0.08em] text-alonzo-gray-600 hover:border-alonzo-black hover:text-alonzo-black rounded-sm transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes searchSlideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .search-slide-down {
          animation: searchSlideDown 0.25s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}

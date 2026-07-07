'use client';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Product } from '@/types';
import { isSingleSizeLabel } from '@/lib/sizes';
import { deriveSubcategory } from '@/config';

export interface FilterState {
  sortBy: 'default' | 'price_asc' | 'price_desc';
  sizes: string[];
  onSale: boolean;
  subcategory: string | null;
}

export const defaultFilters: FilterState = {
  sortBy: 'default',
  sizes: [],
  onSale: false,
  subcategory: null,
};

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  filters: FilterState;
  onApply: (filters: FilterState) => void;
  availableSizes: string[];
  products: Product[]; // base products (pre-filter) to compute count
}

export function FilterDrawer({ open, onClose, filters, onApply, availableSizes, products }: FilterDrawerProps) {
  // Draft state — local until user clicks "Ver productos"
  const [draft, setDraft] = useState<FilterState>(filters);

  // Reset draft when drawer opens
  useEffect(() => {
    if (open) setDraft(filters);
  }, [open]);

  if (!open) return null;

  const toggleSize = (size: string) => {
    const next = draft.sizes.includes(size)
      ? draft.sizes.filter((s) => s !== size)
      : [...draft.sizes, size];
    setDraft({ ...draft, sizes: next });
  };

  const hasActiveFilters = draft.sortBy !== 'default' || draft.sizes.length > 0 || draft.onSale || !!draft.subcategory;

  // Compute result count with draft filters
  const draftCount = applyFilters(products, draft).length;

  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  const handleClear = () => {
    setDraft(defaultFilters);
  };

  return (
    <div className="fixed inset-0 z-[300]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Panel — right side */}
      <div className="absolute top-0 right-0 bottom-0 w-[85%] max-w-[360px] bg-white flex flex-col filter-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-14 border-b border-alonzo-gray-200">
          <span className="text-[13px] tracking-[0.12em] uppercase font-medium text-alonzo-charcoal">
            Filtros
          </span>
          <button onClick={onClose}>
            <X size={20} strokeWidth={1.5} className="text-alonzo-charcoal" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-7">

          {/* Sort */}
          <div>
            <p className="text-[10px] tracking-[0.15em] uppercase text-alonzo-gray-400 font-medium mb-3">
              Ordenar por
            </p>
            <div className="space-y-1">
              {([
                { value: 'default', label: 'Relevancia' },
                { value: 'price_asc', label: 'Precio: menor a mayor' },
                { value: 'price_desc', label: 'Precio: mayor a menor' },
              ] as { value: FilterState['sortBy']; label: string }[]).map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDraft({ ...draft, sortBy: opt.value })}
                  className={`w-full text-left px-3 py-2.5 text-[12px] tracking-wide rounded-sm transition-colors ${
                    draft.sortBy === opt.value
                      ? 'bg-alonzo-black text-white'
                      : 'text-alonzo-gray-600 hover:bg-alonzo-gray-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sizes */}
          {availableSizes.length > 0 && (
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-alonzo-gray-400 font-medium mb-3">
                Talla
              </p>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => toggleSize(size)}
                    className={`min-w-[42px] h-[36px] px-3 flex items-center justify-center text-[11px] font-semibold uppercase border rounded-sm transition-colors ${
                      draft.sizes.includes(size)
                        ? 'bg-alonzo-black text-white border-alonzo-black'
                        : 'border-alonzo-gray-300 text-alonzo-gray-600 hover:border-alonzo-black'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* On sale */}
          <div>
            <button
              onClick={() => setDraft({ ...draft, onSale: !draft.onSale })}
              className="flex items-center gap-3 w-full text-left py-1"
            >
              <span className={`w-5 h-5 border-2 rounded-sm flex items-center justify-center transition-colors ${
                draft.onSale ? 'bg-alonzo-black border-alonzo-black' : 'border-alonzo-gray-400'
              }`}>
                {draft.onSale && (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2.5 6l2.5 2.5 4.5-5" />
                  </svg>
                )}
              </span>
              <span className="text-[12px] tracking-wide text-alonzo-charcoal">
                Solo ofertas
              </span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-alonzo-gray-200 px-5 py-4 space-y-2">
          {hasActiveFilters && (
            <button
              onClick={handleClear}
              className="w-full py-2.5 text-[11px] tracking-[0.1em] uppercase text-alonzo-gray-500 hover:text-alonzo-black transition-colors"
            >
              Limpiar filtros
            </button>
          )}
          <button
            onClick={handleApply}
            className="w-full py-3 bg-alonzo-black text-white text-[11px] tracking-[0.15em] uppercase font-medium rounded-sm hover:bg-alonzo-charcoal transition-colors"
          >
            Ver {draftCount} producto{draftCount !== 1 ? 's' : ''}
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes filterSlideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .filter-slide-in {
          animation: filterSlideIn 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}

// Helper: extract all unique sizes from products
export function extractSizes(products: Product[]): string[] {
  const sizeSet = new Set<string>();
  products.forEach((p) => {
    p.variants.forEach((v) => {
      if (v.size && !isSingleSizeLabel(v.size) && parseInt(v.stock) > 0) sizeSet.add(v.size);
    });
  });
  const order = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
  return Array.from(sizeSet).sort((a, b) => {
    const aNum = parseInt(a);
    const bNum = parseInt(b);
    if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
    if (!isNaN(aNum)) return -1;
    if (!isNaN(bNum)) return 1;
    const ai = order.indexOf(a.toUpperCase());
    const bi = order.indexOf(b.toUpperCase());
    if (ai !== -1 && bi !== -1) return ai - bi;
    return a.localeCompare(b);
  });
}

// Helper: extract all unique subcategories present in a set of products
// (ej: dentro de "Pantalones", los que sean Cargo / Corte Recto / etc.),
// en el orden en que están definidas las reglas.
export function extractSubcategories(products: Product[]): string[] {
  const found = new Set<string>();
  products.forEach((p) => {
    const sub = deriveSubcategory(p.category, p.name);
    if (sub) found.add(sub);
  });
  return Array.from(found);
}

// Helper: apply filters to products
export function applyFilters(products: Product[], filters: FilterState): Product[] {
  let result = [...products];
  if (filters.subcategory) {
    result = result.filter((p) => deriveSubcategory(p.category, p.name) === filters.subcategory);
  }
  if (filters.sizes.length > 0) {
    result = result.filter((p) =>
      p.variants.some((v) => filters.sizes.includes(v.size) && parseInt(v.stock) > 0)
    );
  }
  if (filters.onSale) {
    result = result.filter((p) => p.offer && p.offer.value > 0);
  }
  if (filters.sortBy === 'price_asc' || filters.sortBy === 'price_desc') {
    result.sort((a, b) => {
      const priceA = parseFloat(a.variants[0]?.price || a.price || '0');
      const priceB = parseFloat(b.variants[0]?.price || b.price || '0');
      return filters.sortBy === 'price_asc' ? priceA - priceB : priceB - priceA;
    });
  } else {
    result.sort((a, b) =>
      a.category.localeCompare(b.category, 'es', { sensitivity: 'base' }) ||
      a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
    );
  }
  return result;
}

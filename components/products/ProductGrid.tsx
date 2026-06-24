'use client';
import { useRef } from 'react';
import type { Product } from '@/types';
import { ProductCard } from './ProductCard';

// Track if grid has already animated — skip on back navigation
let hasAnimated = false;

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  onProductClick: (product: Product) => void;
  sectionTitle?: string;
  gridCols?: 1 | 2 | 3 | 4;
  /** Acción de salida cuando no hay resultados (limpiar filtros / ver todo). */
  emptyAction?: { label: string; onClick: () => void };
}

const gridClasses: Record<number, string> = {
  1: 'grid-cols-1 gap-y-8 max-w-[400px] mx-auto',
  2: 'grid-cols-2 gap-x-3 gap-y-12 md:gap-x-5 md:gap-y-16',
  3: 'grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-12 md:gap-x-5 md:gap-y-16',
  4: 'grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-12 md:gap-x-4 md:gap-y-16',
};

export function ProductGrid({ products, loading, onProductClick, sectionTitle, gridCols, emptyAction }: ProductGridProps) {
  const cols = gridCols || 4;
  const skipAnimation = useRef(hasAnimated);

  // Mark as animated after first render with products
  if (products.length > 0 && !loading) {
    hasAnimated = true;
  }

  if (loading) {
    return (
      <div className="w-full px-3 md:px-6 lg:px-10">
        {sectionTitle && <SectionTitle title={sectionTitle} />}
        <div className={`grid ${gridClasses[cols]}`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i}>
              <div className="relative w-full pt-[133%] rounded-sm skeleton-shimmer" />
              <div className="mt-3 space-y-2">
                <div className="h-3 w-3/4 rounded skeleton-shimmer" />
                <div className="h-3 w-1/3 rounded skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="w-full px-3 md:px-6 lg:px-10 py-16 text-center">
        <p className="text-alonzo-gray-600 text-sm tracking-wider mb-5">
          Sin resultados.
        </p>
        {emptyAction && (
          <button
            onClick={emptyAction.onClick}
            className="btn-outline !w-auto px-8 py-3 font-sans font-medium text-xs"
          >
            {emptyAction.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full px-3 md:px-6 lg:px-10">
      {sectionTitle && <SectionTitle title={sectionTitle} />}
      <div className={`grid ${gridClasses[cols]}`}>
        {products.map((product, idx) => (
          <div
            key={product.id}
            className={skipAnimation.current ? '' : (idx < 8 ? `stagger-up stagger-${idx + 1}` : 'page-fade-soft')}
          >
            <ProductCard
              product={product}
              onClick={() => onProductClick(product)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="text-center mb-8 md:mb-10">
      <h2 className="text-lg md:text-xl font-normal text-alonzo-charcoal tracking-wide">
        {title}
      </h2>
      <div className="w-12 h-px bg-alonzo-gray-400 mx-auto mt-3" />
    </div>
  );
}

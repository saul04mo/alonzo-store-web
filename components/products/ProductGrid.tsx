'use client';
import type { Product } from '@/types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  onProductClick: (product: Product) => void;
  sectionTitle?: string;
  gridCols?: 2 | 3 | 4;
}

const gridClasses: Record<number, string> = {
  2: 'grid-cols-2 gap-x-3 gap-y-12 md:gap-x-5 md:gap-y-16',
  3: 'grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-12 md:gap-x-5 md:gap-y-16',
  4: 'grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-12 md:gap-x-4 md:gap-y-16',
};

export function ProductGrid({ products, loading, onProductClick, sectionTitle, gridCols }: ProductGridProps) {
  const cols = gridCols || 4;

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
      <div className="w-full px-3 md:px-6 lg:px-10 py-16">
        <p className="text-center text-alonzo-gray-500 text-sm tracking-wider">
          Sin resultados.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full px-3 md:px-6 lg:px-10">
      {sectionTitle && <SectionTitle title={sectionTitle} />}
      <div className={`grid ${gridClasses[cols]}`}>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onClick={() => onProductClick(product)}
          />
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

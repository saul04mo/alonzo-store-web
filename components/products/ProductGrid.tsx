'use client';
import type { Product } from '@/types';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  loading: boolean;
  onProductClick: (product: Product) => void;
  sectionTitle?: string;
}

export function ProductGrid({ products, loading, onProductClick, sectionTitle }: ProductGridProps) {
  if (loading) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 md:px-10">
        {sectionTitle && <SectionTitle title={sectionTitle} />}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
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
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-16">
        <p className="text-center text-alonzo-gray-500 text-sm tracking-wider">
          Sin resultados.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-10">
      {sectionTitle && <SectionTitle title={sectionTitle} />}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
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

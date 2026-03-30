'use client';
import { useState } from 'react';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const [loaded, setLoaded] = useState(false);

  const price =
    product.variants.length > 0 ? product.variants[0].price : product.price || '0.00';

  const imageUrl = product.imageUrl || 'https://via.placeholder.com/400x600';

  return (
    <button
      onClick={onClick}
      className="flex flex-col text-left cursor-pointer group mb-2 md:mb-4"
    >
      {/* Image — 3:4 aspect ratio for Farfetch look */}
      <div
        className={`relative w-full pt-[133%] overflow-hidden rounded-sm ${
          !loaded ? 'skeleton-shimmer' : 'bg-alonzo-gray-100'
        }`}
      >
        <img
          src={imageUrl}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          className={`
            absolute inset-0 w-full h-full object-cover object-center
            transition-all duration-700 ease-out
            ${loaded ? 'opacity-100 group-hover:scale-[1.03]' : 'opacity-0'}
          `}
        />
      </div>

      {/* Product info — Farfetch editorial style */}
      <div className="mt-3 space-y-1">
        <p className="text-xs text-alonzo-gray-600 tracking-wide leading-relaxed line-clamp-2 group-hover:text-alonzo-black transition-colors">
          {product.name}
        </p>
        <p className="text-xs font-medium text-alonzo-black">$ {price}</p>
      </div>
    </button>
  );
}

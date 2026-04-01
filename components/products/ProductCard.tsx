'use client';
import { useState } from 'react';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

function calcDiscountedPrice(price: number, offer: Product['offer']): number {
  if (!offer || !offer.value) return price;
  if (offer.type === 'percentage') return price - (price * offer.value / 100);
  return Math.max(0, price - offer.value);
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const [loaded, setLoaded] = useState(false);

  const rawPrice = product.variants.length > 0
    ? parseFloat(product.variants[0].price)
    : parseFloat(product.price || '0');
  const hasOffer = product.offer && product.offer.value > 0;
  const finalPrice = hasOffer ? calcDiscountedPrice(rawPrice, product.offer) : rawPrice;

  const imageUrl = product.imageUrl || 'https://via.placeholder.com/400x600';

  return (
    <button
      onClick={onClick}
      className="flex flex-col text-left cursor-pointer group mb-2 md:mb-4"
    >
      {/* Image — 3:4 aspect ratio */}
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

        {/* Offer badge */}
        {hasOffer && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm tracking-wider">
            {product.offer!.type === 'percentage'
              ? `-${product.offer!.value}%`
              : `-$${product.offer!.value}`}
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="mt-3 space-y-1">
        <p className="text-xs text-alonzo-gray-600 tracking-wide leading-relaxed line-clamp-2 group-hover:text-alonzo-black transition-colors">
          {product.name}
        </p>
        {hasOffer ? (
          <div className="flex items-center gap-2">
            <p className="text-xs font-medium text-red-600">$ {finalPrice.toFixed(2)}</p>
            <p className="text-[10px] text-gray-400 line-through">$ {rawPrice.toFixed(2)}</p>
          </div>
        ) : (
          <p className="text-xs font-medium text-alonzo-black">$ {rawPrice.toFixed(2)}</p>
        )}
      </div>
    </button>
  );
}

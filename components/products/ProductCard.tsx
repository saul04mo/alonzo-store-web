'use client';
import { useState } from 'react';
import { useCartStore, useUIStore } from '@/stores';
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
  const [showSizes, setShowSizes] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const setCartDrawerOpen = useUIStore((s) => s.setCartDrawerOpen);

  const rawPrice = product.variants.length > 0
    ? parseFloat(product.variants[0].price)
    : parseFloat(product.price || '0');
  const hasOffer = product.offer && product.offer.value > 0;
  const finalPrice = hasOffer ? calcDiscountedPrice(rawPrice, product.offer) : rawPrice;

  const imageUrl = product.imageUrl || 'https://via.placeholder.com/400x600';

  // Build size info with stock + find the matching variant
  const sizeMap = new Map<string, { stock: number; variantIndex: number }>();
  product.variants.forEach((v, idx) => {
    if (v.size) {
      const stock = parseInt(v.stock) || 0;
      const existing = sizeMap.get(v.size);
      if (!existing || stock > existing.stock) {
        sizeMap.set(v.size, { stock, variantIndex: idx });
      }
    }
  });

  const uniqueSizes = Array.from(sizeMap.entries()).map(([size, info]) => ({
    size,
    inStock: info.stock > 0,
    variantIndex: info.variantIndex,
  }));

  const handleSizeClick = (e: React.MouseEvent, sizeInfo: typeof uniqueSizes[0]) => {
    e.stopPropagation();
    e.preventDefault();
    if (!sizeInfo.inStock) return;

    const variant = product.variants[sizeInfo.variantIndex];
    const itemKey = `${product.id}-${variant.size}-${variant.color}`;
    addItem({
      key: itemKey,
      productId: product.id,
      titulo: product.name,
      img: product.imageUrl,
      precio: variant.price,
      qty: 1,
      size: variant.size,
      color: variant.color,
      variantIndex: sizeInfo.variantIndex,
    });
    setCartDrawerOpen(true);
  };

  // Preload full-size image on hover for instant detail page
  const handleMouseEnter = () => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'image';
    link.href = imageUrl;
    if (!document.querySelector(`link[href="${imageUrl}"]`)) {
      document.head.appendChild(link);
    }
  };

  // On mobile: first tap shows sizes, tap again goes to detail
  // On desktop: click goes to detail (sizes show on hover)
  const handleCardClick = (e: React.MouseEvent) => {
    // If on mobile (< 640px) and sizes exist and not yet showing
    if (window.innerWidth < 640 && uniqueSizes.length > 0 && !showSizes) {
      e.preventDefault();
      e.stopPropagation();
      setShowSizes(true);
      return;
    }
    // Otherwise go to detail
    onClick();
  };

  return (
    <button
      onClick={handleCardClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShowSizes(false)}
      className="flex flex-col text-left cursor-pointer group mb-2 md:mb-4"
    >
      {/* Image — 4:5 aspect ratio */}
      <div
        className={`relative w-full pt-[125%] overflow-hidden rounded-sm ${
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
            transition-all duration-300 ease-out
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

        {/* Sizes Overlay — desktop hover only (inside overflow-hidden) */}
        {uniqueSizes.length > 0 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 border border-alonzo-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out z-10 hidden sm:flex">
            {uniqueSizes.map(({ size, inStock, variantIndex }, idx) => (
              <div
                key={size}
                onClick={(e) => handleSizeClick(e, { size, inStock, variantIndex })}
                className={`flex items-center justify-center min-w-[44px] h-[44px] text-[13px] font-semibold uppercase relative cursor-pointer transition-colors duration-150 ${
                  idx > 0 ? 'border-l border-alonzo-gray-300' : ''
                } ${!inStock ? 'text-alonzo-gray-400 cursor-not-allowed' : 'text-alonzo-charcoal hover:bg-alonzo-black hover:text-white'}`}
              >
                {size}
                {!inStock && (
                  <svg className="absolute inset-0 w-full h-full text-alonzo-gray-400 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sizes — mobile only (outside overflow-hidden, below image) */}
      {uniqueSizes.length > 0 && showSizes && (
        <div className="flex sm:hidden flex-wrap gap-1 mt-1.5 animate-fade-in">
          {uniqueSizes.map(({ size, inStock, variantIndex }) => (
            <div
              key={size}
              onClick={(e) => handleSizeClick(e, { size, inStock, variantIndex })}
              className={`flex items-center justify-center min-w-[30px] h-[26px] px-1.5 text-[10px] font-semibold border rounded-sm cursor-pointer transition-colors ${
                !inStock ? 'text-gray-300 border-gray-200 cursor-not-allowed' : 'text-gray-700 border-gray-300 bg-white active:bg-black active:text-white'
              }`}
            >
              {size}
            </div>
          ))}
        </div>
      )}

      {/* Product info */}
      <div className="mt-3 space-y-1.5 px-1 text-left">
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest leading-relaxed line-clamp-2 group-hover:text-alonzo-black transition-colors">
          {product.name}
        </p>
        {hasOffer ? (
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-medium text-red-600">${finalPrice.toFixed(2)}</p>
            <p className="text-[10px] text-slate-400 line-through">${rawPrice.toFixed(2)}</p>
          </div>
        ) : (
          <p className="text-[11px] font-normal text-slate-400">${rawPrice.toFixed(2)}</p>
        )}
      </div>
    </button>
  );
}

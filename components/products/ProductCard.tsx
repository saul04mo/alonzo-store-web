'use client';
import { useState, useRef } from 'react';
import { Plus } from 'lucide-react';
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
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();
  const addItem = useCartStore((s) => s.addItem);
  const setCartDrawerOpen = useUIStore((s) => s.setCartDrawerOpen);

  const rawPrice = product.variants.length > 0
    ? parseFloat(product.variants[0].price)
    : parseFloat(product.price || '0');
  const hasOffer = product.offer && product.offer.value > 0;
  const finalPrice = hasOffer ? calcDiscountedPrice(rawPrice, product.offer) : rawPrice;

  const imageUrl = product.imageUrl || 'https://via.placeholder.com/400x600';

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
    setShowSizes(false);
    setCartDrawerOpen(true);
  };

  const handleMouseEnter = () => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.as = 'image';
    link.href = imageUrl;
    if (!document.querySelector(`link[href="${imageUrl}"]`)) {
      document.head.appendChild(link);
    }
  };

  // Hover on + button → show sizes
  const handlePlusEnter = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearTimeout(hideTimer.current);
    setShowSizes(true);
  };

  // Leave sizes area → hide after small delay
  const handleSizesLeave = () => {
    hideTimer.current = setTimeout(() => setShowSizes(false), 120);
  };

  // Enter sizes bar → cancel hide
  const handleSizesEnter = () => {
    clearTimeout(hideTimer.current);
  };

  return (
    <div
      className="flex flex-col text-left cursor-pointer group mb-2 md:mb-4"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => { clearTimeout(hideTimer.current); setShowSizes(false); }}
    >
      {/* Image — 4:5 aspect ratio */}
      <div
        className={`relative w-full pt-[125%] overflow-hidden rounded-sm ${
          !loaded ? 'skeleton-shimmer' : 'bg-alonzo-gray-100'
        }`}
        onClick={onClick}
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

        {/* +/× Button — bottom right: always visible on mobile, hover on desktop */}
        {uniqueSizes.length > 0 && (
          <div
            onMouseEnter={!showSizes ? handlePlusEnter : handleSizesEnter}
            onMouseLeave={showSizes ? handleSizesLeave : undefined}
            onClick={(e) => { e.stopPropagation(); setShowSizes(!showSizes); }}
            className={`absolute right-2 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center z-30 transition-all duration-200 cursor-pointer ${
              showSizes
                ? 'bottom-[42px] sm:bottom-[46px] opacity-100'
                : 'bottom-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
            }`}
          >
            {showSizes ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="text-alonzo-black">
                <line x1="3" y1="3" x2="11" y2="11" /><line x1="11" y1="3" x2="3" y2="11" />
              </svg>
            ) : (
              <Plus size={18} strokeWidth={2.5} className="text-alonzo-black" />
            )}
          </div>
        )}

        {/* Sizes bar — horizontal, bottom of image */}
        {showSizes && uniqueSizes.length > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 bg-white/95 border-t border-alonzo-gray-300 z-20 flex justify-center sizes-reveal"
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={handleSizesEnter}
            onMouseLeave={handleSizesLeave}
          >
            {uniqueSizes.map(({ size, inStock, variantIndex }, idx) => (
              <div
                key={size}
                onClick={(e) => handleSizeClick(e, { size, inStock, variantIndex })}
                className={`flex items-center justify-center flex-1 h-[30px] sm:h-[34px] text-[9px] sm:text-[11px] font-semibold uppercase relative cursor-pointer transition-colors duration-150 ${
                  idx > 0 ? 'border-l border-alonzo-gray-200' : ''
                } ${!inStock ? 'text-alonzo-gray-400 cursor-not-allowed' : 'text-alonzo-charcoal hover:bg-alonzo-black hover:text-white'}`}
              >
                {size}
                {!inStock && (
                  <svg className="absolute inset-0 w-full h-full text-alonzo-gray-400 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <line x1="20" y1="50" x2="80" y2="50" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="mt-3 space-y-1.5 px-1 text-left" onClick={onClick}>
        <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest leading-relaxed line-clamp-2 group-hover:text-alonzo-black transition-colors">
          {product.name}
        </p>
        {hasOffer ? (
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-medium text-red-600">€{finalPrice.toFixed(2)}</p>
            <p className="text-[10px] text-slate-400 line-through">€{rawPrice.toFixed(2)}</p>
          </div>
        ) : (
          <p className="text-[11px] font-normal text-slate-400">€{rawPrice.toFixed(2)}</p>
        )}
      </div>

      <style jsx>{`
        @keyframes sizesReveal {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .sizes-reveal {
          animation: sizesReveal 0.15s ease-out;
        }
      `}</style>
    </div>
  );
}

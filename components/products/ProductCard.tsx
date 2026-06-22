'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cs } from '@/lib/format';
import { Plus } from 'lucide-react';
import { useCartStore, useUIStore } from '@/stores';
import type { Product } from '@/types';
import { productHref } from '@/lib/productUrl';

// Global cache — survives component remounts (back navigation)
const loadedImages = new Set<string>();

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
  const router = useRouter();
  const wasCached = loadedImages.has(product.imageUrl || '');
  const [loaded, setLoaded] = useState(wasCached);
  const [showSizes, setShowSizes] = useState(false);
  const addItem = useCartStore((s) => s.addItem);
  const setCartDrawerOpen = useUIStore((s) => s.setCartDrawerOpen);

  const rawPrice = product.variants.length > 0
    ? parseFloat(product.variants[0].price)
    : parseFloat(product.price || '0');
  const hasOffer = product.offer && product.offer.value > 0;
  const finalPrice = hasOffer ? calcDiscountedPrice(rawPrice, product.offer) : rawPrice;

  const imageUrl = product.imageUrl || 'https://via.placeholder.com/400x600';
  const secondImage = product.images?.length > 1 ? product.images[1] : null;
  const [hovered, setHovered] = useState(false);
  const [secondLoaded, setSecondLoaded] = useState(() => loadedImages.has(secondImage || ''));

  // canHover detecta si el dispositivo tiene mouse real (desktop con
  // mouse o trackpad). En t\u00e1ctiles puros (mobile/tablet) da false
  // y el hover swap NUNCA se activa \u2014 evita que al tocar la card se
  // vea un cross-fade momentaneo antes de navegar al producto.
  // Lo calculamos en useEffect para que sea reactivo a cambios
  // (ej: conectar/desconectar mouse a un tablet).
  const [canHover, setCanHover] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    setCanHover(mq.matches);
    const handler = (e: MediaQueryListEvent) => setCanHover(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

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
    // Prefetch la página del detalle para navegación instantánea
    router.prefetch(productHref(product));

    // Prefetch imágenes
    [imageUrl, secondImage].filter(Boolean).forEach((src) => {
      if (src && !document.querySelector(`link[href="${src}"]`)) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.as = 'image';
        link.href = src;
        document.head.appendChild(link);
      }
    });
  };

  // Hover on + button → show sizes
  const toggleSizes = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSizes(!showSizes);
  };

  return (
    <div
      className="flex flex-col text-left cursor-pointer group mb-2 md:mb-4"
      onMouseEnter={() => { handleMouseEnter(); if (canHover) setHovered(true); }}
      onMouseLeave={() => { setShowSizes(false); setHovered(false); }}
    >
      {/* Image — 4:5 aspect ratio */}
      <div
        className={`relative w-full pt-[125%] overflow-hidden rounded-sm ${
          !loaded ? 'bg-alonzo-gray-100' : 'bg-alonzo-gray-100'
        }`}
        onClick={onClick}
      >
        {/* Blur placeholder — shows before image loads */}
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-alonzo-gray-100">
            <img src="/images/logoAlonzo.png" alt="" className="w-10 h-10 object-contain opacity-[0.06]" />
          </div>
        )}

        <img
          src={imageUrl}
          alt={product.name}
          loading="lazy"
          decoding="async"
          onLoad={() => { loadedImages.add(imageUrl); setLoaded(true); }}
          className={`
            absolute inset-0 w-full h-full object-cover object-top
            ${wasCached ? 'transition-opacity duration-300 ease-out' : 'transition-all duration-700 ease-out'}
            ${loaded ? 'opacity-100 scale-100 blur-0' : 'opacity-0 scale-[1.02] blur-sm'}
            ${canHover && hovered && secondImage && secondLoaded ? '!opacity-0' : ''}
          `}
        />

        {/* Second image — visible on hover. Solo animamos opacity
            (sin blur ni scale) para que el swap sea limpio y r\u00e1pido. */}
        {secondImage && (
          <img
            src={secondImage}
            alt={`${product.name} - 2`}
            loading="lazy"
            decoding="async"
            onLoad={() => { if (secondImage) loadedImages.add(secondImage); setSecondLoaded(true); }}
            className={`
              absolute inset-0 w-full h-full object-cover object-top
              transition-opacity duration-300 ease-out
              ${canHover && hovered && secondLoaded ? 'opacity-100' : 'opacity-0'}
            `}
          />
        )}

        {/* Offer badge */}
        {hasOffer && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-sm tracking-wider">
            {product.offer!.type === 'percentage'
              ? `-${product.offer!.value}%`
              : `-${cs()}${product.offer!.value}`}
          </div>
        )}

        {/* +/× Button — bottom right: always visible on mobile, hover on desktop */}
        {uniqueSizes.length > 0 && (
          <div
            onClick={toggleSizes}
            onMouseEnter={() => { if (canHover) setShowSizes(true); }}
            className={`absolute right-2 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center z-30 transition-all duration-200 cursor-pointer ${
              showSizes
                ? 'bottom-[42px] sm:bottom-[46px] opacity-100'
                : 'bottom-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100'
            }`}
          >
            {showSizes ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" className="text-alonzo-gray-700">
                <line x1="3" y1="3" x2="11" y2="11" /><line x1="11" y1="3" x2="3" y2="11" />
              </svg>
            ) : (
              <Plus size={20} strokeWidth={1.5} className="text-alonzo-gray-700" />
            )}
          </div>
        )}

        {/* Sizes bar — horizontal, bottom of image */}
        {showSizes && uniqueSizes.length > 0 && (
          <div
            className="absolute bottom-0 left-0 right-0 bg-white/95 border-t border-alonzo-gray-300 z-20 flex justify-center sizes-reveal"
            onClick={(e) => e.stopPropagation()}
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
        <p className="text-[12px] font-sans font-medium text-alonzo-gray-600 uppercase tracking-wider leading-relaxed line-clamp-2 group-hover:text-alonzo-black transition-colors">
          {product.name}
        </p>
        {hasOffer ? (
          <div className="flex items-center gap-2">
            <p className="text-[13px] font-sans font-normal text-red-600">{cs()}{finalPrice.toFixed(2)}</p>
            <p className="text-[11px] font-sans font-normal text-alonzo-gray-500 line-through">{cs()}{rawPrice.toFixed(2)}</p>
          </div>
        ) : (
          <p className="text-[13px] font-sans font-normal text-alonzo-gray-600">{cs()}{rawPrice.toFixed(2)}</p>
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

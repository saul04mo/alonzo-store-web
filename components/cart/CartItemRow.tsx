'use client';
import { Heart } from 'lucide-react';
import { useMoney } from '@/lib/useMoney';
import { displaySize } from '@/lib/sizes';
import { useCartStore } from '@/stores';
import type { CartItem } from '@/types';

interface CartItemRowProps {
  item: CartItem;
  index: number;
  offer?: { type: 'percentage' | 'fixed'; value: number };
  onMoveToWishlist: () => void;
}

export function CartItemRow({ item, index, offer, onMoveToWishlist }: CartItemRowProps) {
  const { updateQty, removeItem } = useCartStore();
  const { cs } = useMoney();

  const increaseQty = () => {
    updateQty(index, 1);
  };

  const decreaseQty = () => {
    if (item.qty > 1) {
      updateQty(index, -1);
    }
  };

  const originalPrice = parseFloat(item.precio);
  const hasOffer = offer && offer.value > 0;
  const discountedPrice = hasOffer
    ? (offer.type === 'percentage'
        ? originalPrice - (originalPrice * offer.value / 100)
        : Math.max(0, originalPrice - offer.value))
    : originalPrice;

  return (
    <div className="flex gap-4 md:gap-8 pb-8 border-b border-alonzo-gray-200 last:border-0 relative font-sans">
      {/* Botón de eliminar — anclado arriba a la derecha de la fila. Inline
          junto al precio se salía del viewport en móvil. */}
      <button
        onClick={() => removeItem(index)}
        aria-label="Quitar del carrito"
        className="absolute top-0 right-0 z-10 w-9 h-9 flex items-center justify-center text-alonzo-gray-600 hover:text-alonzo-black transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Image */}
      <div className="w-[104px] h-[140px] md:w-[160px] md:h-[200px] shrink-0 bg-alonzo-gray-100 flex items-center justify-center overflow-hidden rounded-sm relative">
        <img
          src={item.img}
          alt={item.titulo}
          className="w-full h-full object-cover object-top"
        />
        {hasOffer && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
            {offer.type === 'percentage' ? `-${offer.value}%` : `-${cs()}${offer.value}`}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
        <div className="flex flex-col gap-1.5">
          {/* pr-9 reserva el ancho del botón de eliminar (absoluto). */}
          <div className="flex items-start gap-3 pr-9">
            <h3 className="flex-1 min-w-0 text-base font-bold text-alonzo-black tracking-tight line-clamp-2">
              {item.titulo}
            </h3>
            <div className="shrink-0 text-right">
              {hasOffer ? (
                <>
                  <span className="text-base font-semibold text-red-600">{cs()}{discountedPrice.toFixed(2)}</span>
                  <span className="block text-xs text-alonzo-gray-600 line-through">{cs()}{originalPrice.toFixed(2)}</span>
                </>
              ) : (
                <span className="text-base font-semibold">{cs()}{item.precio}</span>
              )}
            </div>
          </div>

          <p className="text-sm text-alonzo-gray-600 mt-2">
            Talla: <span className="font-semibold text-alonzo-black">{displaySize(item.size)}</span>
          </p>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-3">
            <span className="text-sm text-alonzo-gray-600">Cantidad:</span>
            <div className="flex items-center gap-1 md:gap-3 border border-alonzo-gray-300 rounded-sm px-1.5 md:px-2 py-1">
              <button
                onClick={decreaseQty}
                disabled={item.qty <= 1}
                aria-label="Disminuir cantidad"
                className={`w-8 h-8 md:w-9 md:h-9 flex items-center justify-center transition-colors ${item.qty <= 1 ? 'text-alonzo-gray-300 cursor-not-allowed' : 'text-alonzo-gray-600 hover:text-alonzo-black'}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              <span className="text-sm font-medium w-4 text-center">{item.qty}</span>
              <button
                onClick={increaseQty}
                aria-label="Aumentar cantidad"
                className="w-8 h-8 md:w-9 md:h-9 text-alonzo-gray-600 hover:text-alonzo-black flex items-center justify-center transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Wishlist button */}
        <button
          onClick={onMoveToWishlist}
          className="mt-auto self-start text-xs text-alonzo-gray-600 hover:text-alonzo-black flex items-center gap-2 transition-colors pt-4"
        >
          <Heart size={14} strokeWidth={1.5} />
          Mover a la lista de deseos
        </button>
      </div>
    </div>
  );
}

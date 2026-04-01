'use client';
import { Heart } from 'lucide-react';
import { useCartStore } from '@/stores';
import type { CartItem } from '@/types';

interface CartItemRowProps {
  item: CartItem;
  index: number;
  offer?: { type: 'percentage' | 'fixed'; value: number };
}

export function CartItemRow({ item, index, offer }: CartItemRowProps) {
  const { updateQty, removeItem } = useCartStore();

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
    <div className="flex gap-6 md:gap-8 pb-8 border-b border-alonzo-gray-200 last:border-0 relative font-sans">
      {/* Image */}
      <div className="w-[120px] h-[160px] md:w-[160px] md:h-[200px] shrink-0 bg-alonzo-gray-100 flex items-center justify-center overflow-hidden rounded-md relative">
        <img
          src={item.img}
          alt={item.titulo}
          className="w-full h-full object-cover object-top"
        />
        {hasOffer && (
          <div className="absolute top-2 left-2 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
            {offer.type === 'percentage' ? `-${offer.value}%` : `-$${offer.value}`}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 flex flex-col justify-between py-1">
        <div className="flex justify-between items-start w-full">
          <div className="flex flex-col gap-1.5 flex-1 pr-4">
            <span className="text-xs text-alonzo-gray-500">Nueva temporada</span>
            <h3 className="text-base font-bold text-alonzo-black tracking-tight">
              {item.titulo.split(' ')[0]}
            </h3>
            <p className="text-sm text-alonzo-gray-600">
              {item.titulo}
            </p>
            <p className="text-sm text-alonzo-gray-500 mt-2">
              Talla: <span className="font-semibold text-black">{item.size || 'Única'}</span>
            </p>
            
            <div className="flex items-center gap-3 mt-3">
              <span className="text-sm text-alonzo-gray-500">Cantidad:</span>
              <div className="flex items-center gap-3 border border-alonzo-gray-300 rounded px-2 py-1">
                <button 
                  onClick={decreaseQty}
                  disabled={item.qty <= 1}
                  className={`flex items-center justify-center transition-colors ${item.qty <= 1 ? 'text-alonzo-gray-300 cursor-not-allowed' : 'text-alonzo-gray-600 hover:text-black'}`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
                <span className="text-sm font-medium w-4 text-center">{item.qty}</span>
                <button 
                  onClick={increaseQty}
                  className="text-alonzo-gray-600 hover:text-black flex items-center justify-center transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"></line>
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="text-right">
              {hasOffer ? (
                <>
                  <span className="text-base font-semibold text-red-600">${discountedPrice.toFixed(2)}</span>
                  <span className="block text-xs text-gray-400 line-through">${originalPrice.toFixed(2)}</span>
                </>
              ) : (
                <span className="text-base font-semibold">${item.precio}</span>
              )}
            </div>
            {/* Botón de eliminar */}
            <button
              onClick={() => removeItem(index)}
              className="p-1.5 text-alonzo-gray-400 hover:text-black transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Wishlist button */}
        <button className="mt-auto self-start text-xs text-alonzo-gray-600 hover:text-black flex items-center gap-2 transition-colors pt-4">
          <Heart size={14} strokeWidth={1.5} />
          Mover a la lista de deseos
        </button>
      </div>
    </div>
  );
}

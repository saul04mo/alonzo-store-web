'use client';

import { useEffect, useRef } from 'react';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore, useUIStore } from '@/stores';
import { useRouter } from 'next/navigation';

function calcDiscountedPrice(price: number, offer?: { type: string; value: number }): number {
  if (!offer || !offer.value) return price;
  if (offer.type === 'percentage') return price - (price * offer.value / 100);
  return Math.max(0, price - offer.value);
}

export function CartDrawer() {
  const router = useRouter();
  const open = useUIStore((s) => s.cartDrawerOpen);
  const setOpen = useUIStore((s) => s.setCartDrawerOpen);
  const items = useCartStore((s) => s.items);
  const updateQty = useCartStore((s) => s.updateQty);
  const removeItem = useCartStore((s) => s.removeItem);
  const totalItems = useCartStore((s) => s.totalItems);
  const totalMoney = useCartStore((s) => s.totalMoney);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Close on ESC key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, setOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[300]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={() => setOpen(false)}
      />

      {/* Drawer Panel - slides from right */}
      <div
        ref={drawerRef}
        className="absolute top-0 right-0 bottom-0 w-[90%] max-w-[420px] bg-white flex flex-col shadow-2xl cart-drawer-animate"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-alonzo-gray-200">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} strokeWidth={1.5} className="text-alonzo-charcoal" />
            <span className="text-[13px] tracking-[0.1em] uppercase font-semibold text-alonzo-charcoal">
              Tu carrito ({totalItems()})
            </span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-alonzo-gray-500 hover:text-alonzo-black transition-colors"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag size={40} strokeWidth={1} className="text-alonzo-gray-300 mb-4" />
              <p className="text-sm text-alonzo-gray-500 tracking-wide">
                Tu carrito está vacío
              </p>
              <button
                onClick={() => setOpen(false)}
                className="mt-4 text-xs tracking-[0.1em] uppercase text-alonzo-charcoal underline underline-offset-4 hover:text-alonzo-black transition-colors"
              >
                Seguir comprando
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item, idx) => (
                <div key={item.key} className="flex gap-3 cart-item-reveal" style={{ animationDelay: `${idx * 50}ms` }}>
                  {/* Thumbnail */}
                  <div className="w-[72px] h-[96px] flex-shrink-0 overflow-hidden rounded-sm bg-alonzo-gray-100">
                    <img
                      src={item.img}
                      alt={item.titulo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <p className="text-[11px] tracking-wide text-alonzo-charcoal leading-snug line-clamp-2">
                        {item.titulo}
                      </p>
                      <p className="text-[10px] text-alonzo-gray-500 mt-0.5 tracking-wide">
                        Talla: {item.size} {item.color && `· ${item.color}`}
                      </p>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-xs font-semibold text-alonzo-charcoal">
                        $ {(parseFloat(item.precio) * item.qty).toFixed(2)}
                      </p>
                      {/* Qty controls */}
                      <div className="flex items-center gap-0 border border-alonzo-gray-200 rounded-sm">
                        <button
                          onClick={() => updateQty(idx, -1)}
                          className="w-7 h-7 flex items-center justify-center text-alonzo-gray-500 hover:text-alonzo-black transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-6 text-center text-[11px] font-medium text-alonzo-charcoal">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(idx, 1)}
                          className="w-7 h-7 flex items-center justify-center text-alonzo-gray-500 hover:text-alonzo-black transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {/* Remove */}
                  <button
                    onClick={() => removeItem(idx)}
                    className="self-start mt-1 text-alonzo-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-alonzo-gray-200 px-5 py-4 space-y-3">
            {/* Subtotal */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] tracking-[0.1em] uppercase text-alonzo-gray-500">
                Subtotal
              </span>
              <span className="text-sm font-semibold text-alonzo-charcoal">
                $ {totalMoney().toFixed(2)}
              </span>
            </div>
            {/* CTA Buttons */}
            <button
              onClick={() => { setOpen(false); router.push('/cart'); }}
              className="w-full py-3 bg-alonzo-black text-white text-[11px] tracking-[0.15em] uppercase font-semibold rounded-sm hover:bg-alonzo-charcoal transition-colors"
            >
              Ver carrito
            </button>
            <button
              onClick={() => { setOpen(false); router.push('/checkout'); }}
              className="w-full py-3 bg-white text-alonzo-black text-[11px] tracking-[0.15em] uppercase font-semibold rounded-sm border border-alonzo-black hover:bg-alonzo-gray-100 transition-colors"
            >
              Checkout
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .cart-drawer-animate {
          animation: slideInRight 0.3s ease-out;
        }
        @keyframes cartItemReveal {
          from { opacity: 0; transform: translateX(10px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .cart-item-reveal {
          opacity: 0;
          animation: cartItemReveal 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
}

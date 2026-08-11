'use client';
import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore, useUIStore } from '@/stores';
import { CartItemRow } from './CartItemRow';
import { formatBs } from '@/lib/format';
import { useMoney } from '@/lib/useMoney';
import { useExchangeRate } from '@/lib/useExchangeRate';
import { useWishlist } from '@/lib/useWishlist';
import { useToast } from '@/components/ui';
import { auth } from '@/lib/firebase-client';
import { gaViewCart } from '@/lib/analytics';

interface CartPageProps {
  onCheckout: () => void;
}

export function CartPage({ onCheckout }: CartPageProps) {
  const { items, totalItems, totalMoney, removeItem } = useCartStore();
  const { formatUSD } = useMoney();
  const router = useRouter();
  const { toggle, isInWishlist } = useWishlist();
  const setAuthOpen = useUIStore((s) => s.setAuthOpen);
  const toast = useToast();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // GA4 view_cart — una vez al abrir el carrito con contenido.
  useEffect(() => {
    if (items.length > 0) gaViewCart(items);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mover un ítem del carrito a la lista de deseos. Requiere sesión: si no la
  // hay, abrimos el modal de auth en vez de fallar en silencio.
  const moveToWishlist = (productId: string, index: number) => {
    if (!auth.currentUser) {
      toast.show('Inicia sesión para guardar en tu lista de deseos');
      setAuthOpen(true);
      return;
    }
    if (!isInWishlist(productId)) toggle(productId);
    removeItem(index);
    toast.show('Movido a tu lista de deseos');
  };

  // Calculate offer discount desde el snapshot guardado en cada ítem.
  const offerDiscount = useMemo(() => {
    let discount = 0;
    items.forEach((item) => {
      const offer = item.offer;
      if (offer && offer.value > 0) {
        const price = parseFloat(item.precio);
        const lineTotal = price * item.qty;
        if (offer.type === 'percentage') {
          discount += (lineTotal * offer.value) / 100;
        } else {
          discount += Math.min(offer.value * item.qty, lineTotal);
        }
      }
    });
    return Math.round(discount * 100) / 100;
  }, [items]);

  const subtotal = totalMoney();
  const total = Math.max(0, subtotal - offerDiscount);
  const exchangeRate = useExchangeRate();

  const handleCheckout = () => {
    if (items.length === 0) return;
    onCheckout();
  };

  return (
    <>
    <div className="w-full max-w-[1400px] mx-auto px-5 md:px-10 py-10 font-sans min-h-[60vh] page-fade-in">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-alonzo-gray-600 hover:text-alonzo-black transition-colors mb-6 font-medium"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5"></path>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        Volver
      </button>

      <div className="mb-10">
        <h1 className="text-2xl font-normal text-alonzo-black">Carrito de compra</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-10">
        {/* Left Column: Items */}
        <div className="flex-1 md:w-[65%]">
          {items.length === 0 ? (
            <div className="text-center mt-20">
              <p className="text-sm text-alonzo-gray-600 mb-6">
                Aún no tienes artículos en tu carrito. Inicia sesión o regístrate para acceder a recomendaciones personalizadas.
              </p>
              <button onClick={() => router.push('/')} className="btn-outline !w-auto px-8 py-3 font-sans font-medium tracking-normal text-sm">
                Sigue comprando
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              {items.map((item, index) => (
                <CartItemRow
                  key={item.key}
                  item={item}
                  index={index}
                  offer={item.offer}
                  onMoveToWishlist={() => moveToWishlist(item.productId, index)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Summary */}
        <div className="w-full md:w-[35%]">
          {items.length > 0 && (
            <div className="sticky top-28 bg-white md:bg-transparent px-0 md:px-5">
              <h2 className="text-lg font-sans mb-6 font-normal">Resumen</h2>
              
              <div className="space-y-4 text-sm font-sans mb-6 border-b border-alonzo-gray-200 pb-6">
                <div className="flex justify-between text-alonzo-gray-600">
                  <span>Subtotal</span>
                  <span>{formatUSD(subtotal)}</span>
                </div>
                {offerDiscount > 0 && (
                  <div className="flex justify-between text-red-600 font-medium">
                    <span>Ofertas</span>
                    <span>- {formatUSD(offerDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-alonzo-gray-600">
                  <span>Entrega</span>
                  <span>Calculado al final</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold font-sans text-base">Total</span>
                <span className="font-bold text-lg font-sans">
                  {formatUSD(total)}
                </span>
              </div>
              {exchangeRate > 0 && (
                <div className="flex justify-between items-center mb-8">
                  <span className="text-sm text-alonzo-gray-600">Ref. en Bs</span>
                  <span className="text-sm font-medium text-alonzo-gray-600">
                    {formatBs(total * exchangeRate)}
                  </span>
                </div>
              )}
              {!exchangeRate && <div className="mb-8" />}

              {/* CTA in-summary — desktop. En móvil usamos la barra fija de abajo. */}
              <button
                onClick={handleCheckout}
                className="hidden md:block w-full py-4 bg-alonzo-black text-white font-sans text-sm font-medium uppercase tracking-wider hover:bg-alonzo-dark transition-colors mb-4"
              >
                Continuar
              </button>

            </div>
          )}
        </div>
      </div>
    </div>

    {/* Espaciador + barra de carrito fija (solo móvil) — Total + CTA siempre
        visibles para no obligar a hacer scroll hasta el fondo. */}
    {items.length > 0 && (
      <>
        <div className="h-24 md:hidden" aria-hidden="true" />
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-alonzo-gray-300 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
          <div className="flex items-center gap-4">
            <div className="shrink-0">
              <p className="text-[10px] text-alonzo-gray-600 uppercase tracking-wide leading-tight">Total</p>
              <p className="text-lg font-bold text-alonzo-black leading-tight">{formatUSD(total)}</p>
              {exchangeRate > 0 && (
                <p className="text-[10px] text-alonzo-gray-600 leading-tight">{formatBs(total * exchangeRate)}</p>
              )}
            </div>
            <button
              onClick={handleCheckout}
              className="flex-1 py-3.5 bg-alonzo-black text-white text-sm font-medium uppercase tracking-wider active:bg-alonzo-dark transition-colors"
            >
              Continuar
            </button>
          </div>
        </div>
      </>
    )}
    </>
  );
}

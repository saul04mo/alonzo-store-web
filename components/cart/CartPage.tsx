'use client';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores';
import { CartItemRow } from './CartItemRow';
import { formatUSD, formatBs } from '@/lib/format';
import { fetchProducts } from '@/lib/api';
import { useExchangeRate } from '@/lib/useExchangeRate';
import type { Product } from '@/types';

interface CartPageProps {
  onCheckout: () => void;
}

export function CartPage({ onCheckout }: CartPageProps) {
  const { items, totalItems, totalMoney } = useCartStore();
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Fetch products for offer data
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  useEffect(() => {
    fetchProducts().then(setAllProducts).catch(() => {});
  }, []);

  // Calculate offer discount
  const offerDiscount = useMemo(() => {
    let discount = 0;
    items.forEach((item) => {
      const product = allProducts.find((p) => p.id === item.productId);
      if (product?.offer && product.offer.value > 0) {
        const price = parseFloat(item.precio);
        const lineTotal = price * item.qty;
        if (product.offer.type === 'percentage') {
          discount += (lineTotal * product.offer.value) / 100;
        } else {
          discount += Math.min(product.offer.value * item.qty, lineTotal);
        }
      }
    });
    return Math.round(discount * 100) / 100;
  }, [items, allProducts]);

  const subtotal = totalMoney();
  const total = Math.max(0, subtotal - offerDiscount);
  const exchangeRate = useExchangeRate();

  // Build a map of productId -> offer for CartItemRow
  const offerMap = useMemo(() => {
    const map: Record<string, { type: 'percentage' | 'fixed'; value: number }> = {};
    allProducts.forEach((p) => {
      if (p.offer && p.offer.value > 0) map[p.id] = p.offer;
    });
    return map;
  }, [allProducts]);

  const handleCheckout = () => {
    if (items.length === 0) return;
    onCheckout();
  };

  return (
    <div className="w-full max-w-[1400px] mx-auto px-5 md:px-10 py-10 font-sans min-h-[60vh]">
      <button 
        onClick={() => router.back()} 
        className="flex items-center gap-2 text-sm text-alonzo-gray-600 hover:text-black transition-colors mb-6 font-medium"
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
          <div className="flex justify-between items-end border-b border-alonzo-gray-200 pb-4 mb-8">
            <span className="text-sm font-sans text-alonzo-gray-600">
              Es posible que tengas que pagar tasas de importación
            </span>
          </div>

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
                <CartItemRow key={item.key} item={item} index={index} offer={offerMap[item.productId]} />
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
                  USD {formatUSD(total)}
                </span>
              </div>
              {exchangeRate > 0 && (
                <div className="flex justify-between items-center mb-8">
                  <span className="text-sm text-gray-400">Ref. en Bs</span>
                  <span className="text-sm font-medium text-gray-500">
                    {formatBs(total * exchangeRate)}
                  </span>
                </div>
              )}
              {!exchangeRate && <div className="mb-8" />}

              <button
                onClick={handleCheckout}
                className="w-full py-4 bg-[#222] text-white font-sans text-sm font-medium hover:bg-black transition-colors mb-4"
              >
                Continuar
              </button>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}

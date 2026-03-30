'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores';
import { CartItemRow } from './CartItemRow';
import { formatUSD } from '@/lib/format';

interface CartPageProps {
  onCheckout: () => void;
}

export function CartPage({ onCheckout }: CartPageProps) {
  const { items, totalItems, totalMoney } = useCartStore();
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
                <CartItemRow key={item.key} item={item} index={index} />
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
                  <span>{formatUSD(totalMoney())}</span>
                </div>
                <div className="flex justify-between text-alonzo-gray-600">
                  <span>Entrega</span>
                  <span>Calculado al final</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-8">
                <span className="font-semibold font-sans text-base">Total</span>
                <span className="font-bold text-lg font-sans">
                  USD {formatUSD(totalMoney())}
                </span>
              </div>

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

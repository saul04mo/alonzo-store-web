'use client';
import { Modal, ModalHeader, useToast } from '@/components/ui';
import { useCartStore } from '@/stores';
import { CartItemRow } from './CartItemRow';
import { formatUSD } from '@/lib/format';

interface CartViewProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function CartView({ open, onClose, onCheckout }: CartViewProps) {
  const { items, totalItems, totalMoney } = useCartStore();
  const toast = useToast();

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.show('TU CARRITO ESTÁ VACÍO');
      return;
    }
    // We don't close the cart here, leaving it open behind the checkout or closing it in App.tsx
    onCheckout();
  };

  return (
    <Modal open={open} onClose={onClose} zIndex={4000} className="md:!w-[1000px] md:!max-w-[95vw]">
      <ModalHeader title="BOLSA DE COMPRAS" onClose={onClose} />

      <div className="flex flex-col md:flex-row h-full overflow-y-auto">
        {/* Left Column: Items */}
        <div className="flex-1 md:w-[65%] px-5 py-6 md:px-10 overflow-y-auto border-r border-alonzo-gray-200">
          <div className="flex justify-between items-end border-b border-alonzo-gray-200 pb-2 mb-6">
            <span className="text-sm font-sans text-alonzo-black">
              Es posible que tengas que pagar tasas de importación
            </span>
          </div>

          {items.length === 0 ? (
            <div className="text-center mt-20">
              <p className="text-sm text-alonzo-gray-600 mb-6">
                Aún no tienes artículos en tu bolsa. Inicia sesión o regístrate para acceder a recomendaciones personalizadas.
              </p>
              <button onClick={onClose} className="btn-outline !w-auto px-8 py-3 font-sans font-medium tracking-normal text-sm">
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
        <div className="w-full md:w-[35%] bg-alonzo-gray-100/30 px-5 py-6 md:px-10 flex flex-col pt-12">
          {items.length > 0 && (
            <div className="sticky top-0">
              <h2 className="text-lg font-sans mb-6">Resumen</h2>
              
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
                <span className="font-semibold font-sans">Total</span>
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
    </Modal>
  );
}

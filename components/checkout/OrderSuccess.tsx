'use client';
import { useState, useEffect } from 'react';
import { CheckCircle, Star, MessageCircle, Truck, Store, Copy, ShoppingBag } from 'lucide-react';
import { useToast } from '@/components/ui';
import { submitRating } from '@/lib/api';
import { buildOrderWhatsAppMessage, buildWhatsAppLink, cs } from '@/lib/format';
import { useWebSettings } from '@/lib/useWebSettings';
import type { Invoice } from '@/types';

const STORE_ADDRESS = 'ALONZO Store — Retiro en tienda. Te contactaremos para coordinar.';

interface OrderSuccessProps {
  open: boolean;
  onClose: () => void;
  invoiceData: Invoice | null;
  numericId: number;
  docId: string;
  clientId: string;
}

export function OrderSuccess({
  open,
  onClose,
  invoiceData,
  numericId,
  docId,
  clientId,
}: OrderSuccessProps) {
  const toast = useToast();
  const { whatsappNumber } = useWebSettings();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  if (!open || !invoiceData) return null;

  const msg = buildOrderWhatsAppMessage(numericId, invoiceData);
  const whatsappUrl = buildWhatsAppLink(whatsappNumber, msg);

  // Aceptamos tanto los valores nuevos ('local', 'national') como los
  // legacy ('delivery', 'nacional') por si la factura es vieja.
  const dt = invoiceData.deliveryType;
  const deliveryLabel = (dt === 'local' || dt === 'delivery')
    ? 'Delivery'
    : (dt === 'national' || dt === 'nacional')
    ? 'Envío Nacional'
    : 'Retiro en Tienda';

  const DeliveryIcon = invoiceData.deliveryType === 'pickup' ? Store : Truck;
  const subtotal = invoiceData.items.reduce((sum, i) => sum + i.rowTotal, 0);

  const handleSubmitRating = async () => {
    if (rating === 0) { toast.show('Selecciona las estrellas'); return; }
    setSubmitting(true);
    try {
      await submitRating({ invoiceId: docId, clientId, numericId, rating, comment });
      toast.show('¡Gracias por tu opinión!');
      setRatingSubmitted(true);
    } catch { toast.show('Error al enviar'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[8000] bg-black/60 backdrop-blur-[6px] flex items-center justify-center p-4 page-fade-in">
      <div className="bg-white w-full max-w-[480px] rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] max-h-[95vh] overflow-y-auto font-sans">

        {/* Header */}
        <div className="px-8 pt-10 pb-6 text-center border-b border-gray-100">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle size={32} className="text-emerald-500" strokeWidth={1.5} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-1">¡Pedido confirmado!</h2>
          <div className="flex items-center justify-center gap-2 mt-3">
            <span className="text-2xl font-bold text-alonzo-black tracking-wide">#{numericId}</span>
            <button
              onClick={() => { navigator.clipboard.writeText(`Pedido #${numericId} — ALONZO Store`); toast.show('Copiado'); }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <Copy size={14} />
            </button>
          </div>
        </div>

        {/* Order items */}
        <div className="px-8 py-5 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag size={14} className="text-gray-400" />
            <p className="text-[10px] tracking-[0.12em] uppercase font-semibold text-gray-400">Productos</p>
          </div>
          <div className="space-y-3">
            {invoiceData.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                {item.img && (
                  <div className="w-12 h-14 rounded-sm overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-900 truncate">{item.name}</p>
                  <p className="text-[10px] text-gray-400">
                    Talla: {item.size}{item.color ? ` · ${item.color}` : ''} · Cant: {item.quantity}
                  </p>
                </div>
                <p className="text-xs font-semibold text-gray-900 shrink-0">{cs()}{item.rowTotal.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className="px-8 py-4 border-b border-gray-100 space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500">
            <span>Subtotal</span>
            <span>{cs()}{subtotal.toFixed(2)}</span>
          </div>
          {invoiceData.deliveryCostUsd > 0 && (
            <div className="flex justify-between text-xs text-gray-500">
              <span>Envío</span>
              <span>{cs()}{invoiceData.deliveryCostUsd.toFixed(2)}</span>
            </div>
          )}
          {invoiceData.totalDiscount?.value > 0 && (
            <div className="flex justify-between text-xs text-emerald-600 font-medium">
              <span>Descuento</span>
              <span>-{cs()}{invoiceData.totalDiscount.value.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-bold text-gray-900 pt-2 border-t border-gray-100">
            <span>Total</span>
            <span>{cs()}{invoiceData.total.toFixed(2)}</span>
          </div>
          {invoiceData.exchangeRate > 0 && (
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>Ref. en Bs</span>
              <span>Bs. {(invoiceData.total * invoiceData.exchangeRate).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Delivery info */}
        <div className="px-8 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center">
              <DeliveryIcon size={16} className="text-gray-500" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-900">{deliveryLabel}</p>
              {invoiceData.deliveryType === 'pickup' ? (
                <p className="text-[10px] text-gray-400 mt-0.5">{STORE_ADDRESS}</p>
              ) : invoiceData.clientSnapshot?.address ? (
                <p className="text-[10px] text-gray-400 mt-0.5">{invoiceData.clientSnapshot.address}</p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Next steps */}
        <div className="px-8 py-5 border-b border-gray-100">
          <p className="text-[10px] tracking-[0.12em] uppercase font-semibold text-gray-400 mb-3">¿Qué sigue?</p>
          <p className="text-xs text-gray-500 leading-relaxed mb-4">
            Te contactaremos por WhatsApp para coordinar
            {invoiceData.deliveryType === 'pickup' ? ' el retiro de tu pedido.' : ' la entrega de tu pedido.'}
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2.5 bg-[#25D366] hover:bg-[#20bd5a] text-white w-full py-3.5 rounded-xl font-bold text-xs tracking-wide shadow-lg shadow-green-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] no-underline"
          >
            <MessageCircle size={16} />
            Enviar comprobante por WhatsApp
          </a>
        </div>

        {/* Rating */}
        <div className="px-8 py-6">
          {!ratingSubmitted ? (
            <>
              <p className="text-xs font-semibold text-gray-900 mb-3 text-center">¿Qué tal tu experiencia?</p>
              <div className="flex justify-center gap-2.5 mb-4">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button key={val} onClick={() => setRating(val)}
                    className={`transition-all duration-200 hover:scale-110 active:scale-90 ${val <= rating ? 'text-amber-400' : 'text-gray-200'}`}>
                    <Star size={24} fill={val <= rating ? 'currentColor' : 'none'} strokeWidth={1.5} />
                  </button>
                ))}
              </div>
              <textarea rows={2} placeholder="Deja un comentario (opcional)..."
                className="w-full border border-gray-200 rounded-lg p-3 text-xs focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-400 bg-gray-50/50 resize-none mb-3"
                value={comment} onChange={(e) => setComment(e.target.value)} />
              <button onClick={handleSubmitRating} disabled={submitting}
                className="w-full py-3 bg-alonzo-black text-white text-xs font-bold rounded-lg hover:bg-alonzo-charcoal transition-colors disabled:opacity-50">
                {submitting ? 'Enviando...' : 'Enviar calificación'}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center py-2">
              <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center mb-2">
                <Star size={18} className="text-amber-400" fill="currentColor" />
              </div>
              <p className="text-xs font-bold text-gray-900">¡Gracias por tu opinión!</p>
            </div>
          )}
        </div>

        {/* Footer buttons */}
        <div className="px-8 pb-8 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 border border-gray-200 text-xs font-semibold text-gray-600 rounded-lg hover:border-gray-400 transition-colors">
            Seguir comprando
          </button>
          <a href="/account/orders"
            className="flex-1 py-3 bg-alonzo-black text-white text-xs font-semibold rounded-lg hover:bg-alonzo-charcoal transition-colors text-center no-underline">
            Ver mis pedidos
          </a>
        </div>
      </div>
    </div>
  );
}

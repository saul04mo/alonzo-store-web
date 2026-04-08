'use client';
import { useState } from 'react';
import { CheckCircle, Star, MessageCircle } from 'lucide-react';
import { useToast } from '@/components/ui';
import { submitRating } from '@/lib/api';
import { buildOrderWhatsAppMessage, buildWhatsAppLink } from '@/lib/format';
import type { Invoice } from '@/types';

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
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!open || !invoiceData) return null;

  const whatsAppPhone = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '584123380976';
  const msg = buildOrderWhatsAppMessage(numericId, invoiceData);
  const whatsappUrl = buildWhatsAppLink(whatsAppPhone, msg);

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast.show('POR FAVOR SELECCIONA LAS ESTRELLAS');
      return;
    }
    setSubmitting(true);
    try {
      await submitRating({
        invoiceId: docId,
        clientId,
        numericId,
        rating,
        comment,
      });
      toast.show('¡GRACIAS POR TU OPINIÓN!');
      setRatingSubmitted(true);
    } catch (err) {
      console.error('Error enviando rating:', err);
      toast.show('ERROR AL ENVIAR');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[8000] bg-black/60 backdrop-blur-[6px] flex items-center justify-center animate-fade-in p-4">
      <div className="bg-white w-full max-w-[420px] p-10 rounded-2xl text-center shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] flex flex-col items-center max-h-[95vh] overflow-y-auto font-sans">
        {/* Success icon */}
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
          <CheckCircle size={40} className="text-green-500" strokeWidth={1.5} />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          ¡Orden recibida!
        </h2>
        <p className="text-base text-gray-500 mb-8 leading-relaxed max-w-[280px]">
          Tu pedido ha sido procesado correctamente. ¡Gracias por elegirnos!
        </p>

        {/* WhatsApp button */}
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white w-full py-4 rounded-xl font-bold text-sm tracking-normal shadow-lg shadow-green-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] mb-8 no-underline"
        >
          <MessageCircle size={20} />
          Enviar comprobante
        </a>

        {/* Rating section */}
        <div className="w-full border-t border-gray-100 pt-8 mb-4">
          {!ratingSubmitted ? (
            <>
              <p className="text-sm font-semibold text-gray-900 mb-4">
                ¿Qué tal tu experiencia de compra?
              </p>

              <div className="flex justify-center gap-3 mb-6">
                {[1, 2, 3, 4, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => setRating(val)}
                    className={`transition-all duration-200 transform hover:scale-110 active:scale-90 ${
                      val <= rating ? 'text-amber-400' : 'text-gray-200'
                    }`}
                  >
                    <Star 
                      size={28} 
                      fill={val <= rating ? 'currentColor' : 'none'} 
                      strokeWidth={1.5}
                    />
                  </button>
                ))}
              </div>

              <textarea
                rows={3}
                placeholder="Deja un comentario (opcional)..."
                className="w-full border border-gray-200 rounded-xl p-4 text-sm focus:border-black focus:ring-1 focus:ring-black outline-none transition-all placeholder:text-gray-400 bg-gray-50/50 resize-none mb-4"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />

              <button
                onClick={handleSubmitRating}
                disabled={submitting}
                className="w-full py-4 bg-black text-white text-sm font-bold rounded-xl hover:bg-gray-900 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Enviando...' : 'Enviar calificación'}
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center py-4">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-3">
                <Star size={20} className="text-amber-400" fill="currentColor" />
              </div>
              <p className="text-sm font-bold text-gray-900">
                ¡Gracias por tu opinión! ❤️
              </p>
            </div>
          )}
        </div>

        {/* Back button */}
        <button
          onClick={onClose}
          className="mt-4 text-sm font-medium text-gray-500 hover:text-black transition-colors underline underline-offset-4"
        >
          Volver a la tienda
        </button>
      </div>
    </div>
  );
}

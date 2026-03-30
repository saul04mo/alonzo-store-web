'use client';
import { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '584123380976';

export function WhatsAppButton() {
  const [expanded, setExpanded] = useState(false);

  const handleClick = () => {
    if (expanded) {
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola, tengo una consulta sobre un producto.')}`;
      window.open(url, '_blank');
    }
    setExpanded(!expanded);
  };

  return (
    <div className="fixed bottom-28 md:bottom-8 right-4 md:right-8 z-[80] flex flex-col items-end gap-2">
      {/* Tooltip */}
      {expanded && (
        <div className="bg-white shadow-lg rounded-lg p-4 max-w-[220px] border border-alonzo-gray-200 animate-fade-in">
          <p className="text-xs font-medium text-alonzo-charcoal mb-1">¿Necesitas ayuda?</p>
          <p className="text-2xs text-alonzo-gray-500 mb-3">Escríbenos por WhatsApp y te atendemos al instante.</p>
          <button
            onClick={handleClick}
            className="w-full py-2.5 bg-[#25D366] text-white text-xs font-bold tracking-wider rounded-md hover:bg-[#20bd5a] transition-colors"
          >
            ABRIR CHAT
          </button>
        </div>
      )}

      {/* FAB */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          expanded
            ? 'bg-alonzo-gray-600 hover:bg-alonzo-gray-700'
            : 'bg-[#25D366] hover:bg-[#20bd5a] hover:scale-105'
        }`}
      >
        {expanded ? (
          <X size={22} className="text-white" />
        ) : (
          <MessageCircle size={22} className="text-white" />
        )}
      </button>
    </div>
  );
}

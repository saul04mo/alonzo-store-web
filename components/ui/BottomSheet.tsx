'use client';
import { useEffect, useRef, type ReactNode } from 'react';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxHeight?: string;
  zIndex?: number;
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  maxHeight = '60vh',
  zIndex = 6000,
}: BottomSheetProps) {
  const didPush = useRef(false);

  // FIX #16: Proper history cleanup
  useEffect(() => {
    if (!open) {
      if (didPush.current) {
        window.history.back();
        didPush.current = false;
      }
      return;
    }

    window.history.pushState({ sheet: true }, '');
    didPush.current = true;

    const handlePop = () => {
      didPush.current = false;
      onClose();
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [open, onClose]);

  return (
    <div
      style={{ zIndex, maxHeight }}
      className={`
        fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[450px]
        bg-white rounded-t-2xl shadow-2xl
        transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
        ${open ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'}
      `}
    >
      <div className="p-5">
        {/* Drag indicator */}
        <div className="w-10 h-1 bg-alonzo-gray-300 rounded-full mx-auto mb-5" />

        <h3 className="text-2xs text-alonzo-gray-500 tracking-wider text-center uppercase mb-4 font-semibold">
          {title}
        </h3>

        <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: `calc(${maxHeight} - 120px)` }}>
          {children}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 py-2.5 bg-transparent border-0 text-xs text-alonzo-charcoal underline"
        >
          CANCELAR
        </button>
      </div>
    </div>
  );
}

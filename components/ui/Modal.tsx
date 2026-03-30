'use client';
import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  zIndex?: number;
  className?: string;
}

export function Modal({ open, onClose, children, zIndex = 3000, className = '' }: ModalProps) {
  const didPush = useRef(false);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // FIX #16: Track pushState and clean up properly
  useEffect(() => {
    if (!open) {
      // Si cerramos el modal por UI (no por back), limpiar el history entry
      if (didPush.current) {
        window.history.back();
        didPush.current = false;
      }
      return;
    }

    window.history.pushState({ modal: true }, '');
    didPush.current = true;

    const handlePop = () => {
      didPush.current = false;
      onClose();
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop — desktop only */}
      <div
        style={{ zIndex: zIndex - 1 }}
        className="hidden md:block fixed inset-0 bg-black/40 animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        style={{ zIndex }}
        className={`
          fixed inset-0 w-full bg-white flex flex-col overflow-y-auto overscroll-contain
          md:inset-auto md:right-0 md:top-0 md:h-full md:w-[480px] md:shadow-2xl
          transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
          animate-slide-up md:animate-none
          ${className}
        `}
      >
        {children}
      </div>
    </>
  );
}

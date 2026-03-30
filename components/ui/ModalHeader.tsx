'use client';
import { X, ArrowLeft } from 'lucide-react';

interface ModalHeaderProps {
  title: string;
  onClose: () => void;
  variant?: 'close' | 'back';
}

export function ModalHeader({ title, onClose, variant = 'close' }: ModalHeaderProps) {
  const Icon = variant === 'back' ? ArrowLeft : X;

  return (
    <div className="relative w-full px-5 py-4 flex justify-between items-center shrink-0">
      <button
        onClick={onClose}
        className="w-10 h-10 flex items-center justify-start text-alonzo-charcoal"
      >
        <Icon size={20} strokeWidth={1.5} />
      </button>

      <div className="text-sm font-bold tracking-wider">{title}</div>

      {/* Invisible spacer to center the title */}
      <div className="w-10 h-10 opacity-0">
        <X size={20} />
      </div>
    </div>
  );
}

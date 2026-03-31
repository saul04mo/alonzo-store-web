'use client';

import { useState } from 'react';
import { Ticket, X, CheckCircle2, Loader2 } from 'lucide-react';
import { auth } from '@/lib/firebase-client';

export interface AppliedCouponWeb {
  couponId: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  discountAmount: number;
  description: string;
  freeShipping: boolean;
}

interface CouponInputProps {
  subtotal: number;
  onApply: (coupon: AppliedCouponWeb) => void;
  onRemove: () => void;
  appliedCoupon: AppliedCouponWeb | null;
}

export function CouponInput({ subtotal, onApply, onRemove, appliedCoupon }: CouponInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleApply() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setError('');
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        setError('Debes iniciar sesión para usar cupones.');
        return;
      }

      const token = await user.getIdToken();
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: trimmed, subtotal }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Cupón inválido.');
        return;
      }

      onApply(data.coupon);
      setCode('');
    } catch {
      setError('Error de conexión. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  }

  // ── Coupon Applied State ──
  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center gap-3 min-w-0">
          <CheckCircle2 size={18} className="text-green-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-green-700">{appliedCoupon.code}</p>
            <p className="text-xs text-green-600">{appliedCoupon.description}</p>
            {appliedCoupon.freeShipping && (
              <p className="text-xs text-green-600 mt-0.5">+ Envío gratis incluido</p>
            )}
          </div>
        </div>
        <button
          onClick={onRemove}
          className="p-1.5 text-green-400 hover:text-red-500 transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  // ── Coupon Input State ──
  return (
    <div>
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Ticket size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-3.5 text-base font-mono tracking-wider uppercase
                       placeholder:text-gray-400 placeholder:normal-case placeholder:tracking-normal placeholder:font-sans
                       focus:outline-none focus:border-black transition-colors"
            placeholder="Ingresa tu código de cupón"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
            disabled={loading}
          />
        </div>
        <button
          onClick={handleApply}
          disabled={!code.trim() || loading}
          className="px-6 py-3.5 bg-black text-white text-sm font-medium rounded-lg
                     hover:bg-gray-900 transition-colors
                     disabled:bg-gray-300 disabled:cursor-not-allowed shrink-0"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : 'Aplicar'}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600 font-medium mt-2">{error}</p>
      )}
    </div>
  );
}

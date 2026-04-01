'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Ticket, Copy, CheckCircle, Clock, Gift } from 'lucide-react';
import { useToast } from '@/components/ui';
import { auth } from '@/lib/firebase-client';

interface PublicCoupon {
  code: string;
  description: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase: number;
  freeShipping: boolean;
  expiresAt: string | null;
  remainingUses: number | null;  // null = unlimited
}

export function MyCouponsPage() {
  const router = useRouter();
  const toast = useToast();
  const [coupons, setCoupons] = useState<PublicCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadCoupons();
  }, []);

  async function loadCoupons() {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const { db, collection, getDocs, query, where } = await import('@/lib/firebase-client');
      const snap = await getDocs(query(collection(db, 'coupons'), where('active', '==', true)));

      const now = Date.now();
      const available: PublicCoupon[] = [];

      snap.forEach((doc) => {
        const d = doc.data();
        // Check date range
        if (d.startsAt && d.startsAt.toMillis() > now) return;
        if (d.expiresAt && d.expiresAt.toMillis() < now) return;
        // Check total uses
        if (d.maxUsesTotal > 0 && (d.usedCount || 0) >= d.maxUsesTotal) return;
        // Check per-client uses
        if (d.maxUsesPerClient > 0) {
          const clientUses = d.usageByClient?.[user.uid] || 0;
          if (clientUses >= d.maxUsesPerClient) return;
        }

        available.push({
          code: d.code,
          description: d.description || '',
          discountType: d.discountType,
          discountValue: d.discountValue,
          minPurchase: d.minPurchase || 0,
          freeShipping: d.freeShipping || false,
          expiresAt: d.expiresAt ? d.expiresAt.toDate().toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' }) : null,
          remainingUses: d.maxUsesPerClient > 0
            ? d.maxUsesPerClient - (d.usageByClient?.[user.uid] || 0)
            : null,
        });
      });

      setCoupons(available);
    } catch (err) {
      console.error('Error loading coupons:', err);
    } finally {
      setLoading(false);
    }
  }

  function handleCopy(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.show('CÓDIGO COPIADO');
    setTimeout(() => setCopiedCode(null), 2000);
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 md:px-10 py-12 font-sans min-h-[60vh]">
      <button
        onClick={() => router.push('/account')}
        className="flex items-center text-[11px] font-bold tracking-widest text-gray-400 hover:text-black transition-colors mb-8 uppercase"
      >
        <ChevronLeft size={14} className="mr-1" /> VOLVER A MI CUENTA
      </button>

      <h1 className="text-[24px] md:text-[28px] font-light text-black leading-tight tracking-tight mb-2">
        Mis Cupones
      </h1>
      <p className="text-sm text-gray-500 mb-12">
        Cupones disponibles para tu próxima compra. Copia el código y úsalo en el checkout.
      </p>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-28 border border-gray-200 animate-pulse bg-gray-50 rounded" />
          ))}
        </div>
      ) : coupons.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-gray-200 rounded-lg">
          <Ticket size={48} strokeWidth={1} className="mx-auto text-gray-300 mb-4" />
          <p className="text-sm text-gray-500 mb-2">No tienes cupones disponibles en este momento.</p>
          <p className="text-xs text-gray-400">Los cupones nuevos aparecerán aquí automáticamente.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {coupons.map((coupon) => (
            <div
              key={coupon.code}
              className="border border-gray-200 hover:border-black transition-colors flex flex-col sm:flex-row overflow-hidden"
            >
              {/* Left: Discount */}
              <div className="bg-black text-white px-6 py-5 flex flex-col items-center justify-center min-w-[140px] shrink-0">
                <p className="text-2xl font-bold">
                  {coupon.discountType === 'percentage'
                    ? `${coupon.discountValue}%`
                    : `$${coupon.discountValue}`}
                </p>
                <p className="text-[10px] uppercase tracking-widest text-gray-400 mt-1">descuento</p>
              </div>

              {/* Right: Details */}
              <div className="flex-1 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="font-mono text-lg font-bold tracking-wider text-black">{coupon.code}</p>
                    <button
                      onClick={() => handleCopy(coupon.code)}
                      className="p-1 text-gray-400 hover:text-black transition-colors"
                    >
                      {copiedCode === coupon.code
                        ? <CheckCircle size={14} className="text-green-500" />
                        : <Copy size={14} />}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600">{coupon.description}</p>
                  <div className="flex flex-wrap gap-3 mt-2.5 text-[10px] text-gray-500">
                    {coupon.minPurchase > 0 && (
                      <span className="flex items-center gap-1">
                        <Gift size={10} /> Compra mínima: ${coupon.minPurchase.toFixed(2)}
                      </span>
                    )}
                    {coupon.freeShipping && (
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        ✓ Incluye envío gratis
                      </span>
                    )}
                    {coupon.expiresAt && (
                      <span className="flex items-center gap-1">
                        <Clock size={10} /> Expira: {coupon.expiresAt}
                      </span>
                    )}
                    {coupon.remainingUses !== null && (
                      <span className="flex items-center gap-1">
                        {coupon.remainingUses} uso{coupon.remainingUses !== 1 ? 's' : ''} restante{coupon.remainingUses !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => { handleCopy(coupon.code); router.push('/'); }}
                  className="bg-black text-white px-6 py-3 text-[10px] font-bold tracking-widest hover:bg-gray-800 transition-colors uppercase shrink-0"
                >
                  USAR AHORA
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

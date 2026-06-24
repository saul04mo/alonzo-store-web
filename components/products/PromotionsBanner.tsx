'use client';

import { useState, useEffect } from 'react';
import { Zap, Gift, Truck, Package, Tag } from 'lucide-react';
import type { ActivePromotion } from '@/types';

const PROMO_ICONS: Record<string, typeof Zap> = {
  nxm: Gift,
  volume_discount: Tag,
  min_purchase: Zap,
  free_shipping: Truck,
  bundle: Package,
};

function formatPromoLabel(promo: ActivePromotion): string {
  switch (promo.type) {
    case 'nxm': {
      const label = promo.buyQty === 2 && promo.payQty === 1 ? '2x1'
        : promo.buyQty === 3 && promo.payQty === 2 ? '3x2'
        : `${promo.buyQty}x${promo.payQty}`;
      return `${label}`;
    }
    case 'volume_discount':
      return `${promo.discountValue}${promo.discountType === 'percentage' ? '%' : '$'} OFF comprando ${promo.minUnits}+ unidades`;
    case 'min_purchase':
      return `${promo.discountValue}${promo.discountType === 'percentage' ? '%' : '$'} OFF en compras +$${promo.minPurchase}`;
    case 'free_shipping':
      return `Envío gratis en compras +$${promo.minPurchase}`;
    case 'bundle':
      return `${promo.discountValue}${promo.discountType === 'percentage' ? '%' : '$'} OFF en combo`;
    default:
      return promo.name;
  }
}

export function PromotionsBanner() {
  const [promotions, setPromotions] = useState<ActivePromotion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/promotions')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setPromotions(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || promotions.length === 0) return null;

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-10 mb-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {promotions.map((promo) => {
          const Icon = PROMO_ICONS[promo.type] || Tag;

          return (
            <div
              key={promo.id}
              className="flex items-center gap-3 p-3.5 rounded-sm border border-alonzo-gray-300 bg-white"
            >
              <div className="shrink-0 text-alonzo-black">
                <Icon size={18} strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-alonzo-black tracking-wide">
                  {formatPromoLabel(promo)}
                </p>
                <p className="text-[10px] text-alonzo-gray-600 mt-0.5 truncate">
                  {promo.description || promo.name}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore, useUIStore } from '@/stores';
import { fetchProducts, seedProduct } from '@/lib/api';
import { productHref } from '@/lib/productUrl';
import { ProductCard } from './ProductCard';
import { useMoney } from '@/lib/useMoney';
import type { Product } from '@/types';

interface CrossSellProps {
  // 'drawer' → mini-cards horizontales (carrito); 'grid' → ProductCard (checkout).
  layout: 'drawer' | 'grid';
  limit?: number;
  title?: string;
}

function displayPrice(p: Product): number {
  const base = p.variants.length > 0 ? parseFloat(p.variants[0].price) : parseFloat(p.price || '0');
  const offer = p.offer;
  if (!offer || !offer.value) return base;
  return offer.type === 'percentage' ? base - (base * offer.value) / 100 : Math.max(0, base - offer.value);
}

export function CrossSell({ layout, limit = 4, title = 'También te puede gustar' }: CrossSellProps) {
  const router = useRouter();
  const { cs } = useMoney();
  const items = useCartStore((s) => s.items);
  const setCartDrawerOpen = useUIStore((s) => s.setCartDrawerOpen);

  // Pool barajado UNA vez al montar — se obtiene del catálogo (cacheado) sin
  // bloquear el render crítico del carrito/checkout.
  const [pool, setPool] = useState<Product[]>([]);
  useEffect(() => {
    let cancelled = false;
    fetchProducts()
      .then((all) => {
        if (cancelled) return;
        setPool([...all].sort(() => Math.random() - 0.5));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Recomendaciones = pool sin lo que ya está en el carrito, y SOLO del mismo
  // género que las prendas del carrito (no tiene sentido sugerir ropa de mujer
  // si compras algo de hombre). El género se deduce del catálogo. Si no se
  // puede determinar (carrito vacío o productos no encontrados), no se filtra.
  const picks = useMemo(() => {
    const inCart = new Set(items.map((i) => i.productId));
    const genders = new Set<string>();
    for (const p of pool) {
      if (inCart.has(p.id) && p.gender) genders.add(p.gender);
    }
    return pool
      .filter((p) => !inCart.has(p.id) && (genders.size === 0 || genders.has(p.gender)))
      .slice(0, limit);
  }, [pool, items, limit]);

  if (picks.length === 0) return null;

  if (layout === 'drawer') {
    return (
      <div className="mt-6 pt-5 border-t border-alonzo-gray-200">
        <p className="text-[11px] tracking-[0.1em] uppercase font-semibold text-alonzo-gray-500 mb-3">
          {title}
        </p>
        <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
          {picks.map((p) => (
            <button
              key={p.id}
              onClick={() => { seedProduct(p); setCartDrawerOpen(false); router.push(productHref(p)); }}
              className="shrink-0 w-[96px] text-left group"
            >
              <div className="w-[96px] h-[120px] bg-alonzo-gray-100 rounded-sm overflow-hidden mb-1.5">
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p className="text-[10px] text-alonzo-charcoal leading-snug line-clamp-2">{p.name}</p>
              <p className="text-[11px] font-semibold text-alonzo-charcoal mt-0.5">
                {cs()}{displayPrice(p).toFixed(2)}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // layout === 'grid' (checkout). Reutiliza ProductCard: incluye quick-add con
  // selector de talla, así el cliente puede sumar prendas sin salir del pago.
  return (
    <div className="w-full max-w-[1400px] mx-auto px-5 md:px-10 pb-12 page-fade-in">
      <h2 className="text-[11px] tracking-[0.18em] uppercase font-medium text-alonzo-gray-500 mb-6">
        {title}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
        {picks.map((p) => (
          <ProductCard
            key={p.id}
            product={p}
            onClick={() => { seedProduct(p); router.push(productHref(p)); }}
          />
        ))}
      </div>
    </div>
  );
}

import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { ActivePromotion } from '@/types';

// Cache (5 min TTL)
let cache: { data: ActivePromotion[]; ts: number } | null = null;
const TTL = 5 * 60 * 1000;

export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const snap = await adminDb.collection('promotions').where('active', '==', true).get();
    const now = Date.now();

    const promotions: ActivePromotion[] = [];
    snap.forEach((doc) => {
      const d = doc.data();

      // Check date range
      if (d.startsAt && d.startsAt.toMillis() > now) return;
      if (d.expiresAt && d.expiresAt.toMillis() < now) return;

      promotions.push({
        id: doc.id,
        name: d.name || '',
        description: d.description || '',
        type: d.type,
        scope: d.scope || 'global',
        scopeTargets: d.scopeTargets || [],
        buyQty: d.buyQty || 0,
        payQty: d.payQty || 0,
        minUnits: d.minUnits || 0,
        discountType: d.discountType || 'percentage',
        discountValue: d.discountValue || 0,
        minPurchase: d.minPurchase || 0,
      });
    });

    cache = { data: promotions, ts: Date.now() };
    return NextResponse.json(promotions);
  } catch (err: any) {
    console.error('[promotions] Error:', err.message);
    return NextResponse.json([], { status: 200 });
  }
}

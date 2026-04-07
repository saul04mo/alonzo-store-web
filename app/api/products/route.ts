import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { blacklistedProductIds, blacklistedCategories } from '@/config';
import type { Product } from '@/types';

// Cache en memoria (5 minutos TTL)
let cache: Record<string, { data: Product[]; ts: number }> = {};
const TTL = 5 * 60 * 1000;

export async function GET(request: NextRequest) {
  const gender = request.nextUrl.searchParams.get('gender') || undefined;
  const cacheKey = gender || 'all';

  // Check cache
  if (cache[cacheKey] && Date.now() - cache[cacheKey].ts < TTL) {
    return NextResponse.json(cache[cacheKey].data);
  }

  try {
    const ref = adminDb.collection('products');
    const q = gender ? ref.where('gender', '==', gender) : ref;
    const snapshot = await q.get();

    const products: Product[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const id = doc.id;

      if (blacklistedProductIds.has(id)) return;
      const category = (data.category || '').trim().toUpperCase();
      if (blacklistedCategories.has(category)) return;

      products.push({
        id,
        name: data.name || 'SIN NOMBRE',
        category: data.category?.trim() || '',
        gender: data.gender || 'Hombre',
        imageUrl: data.imageUrl || '',
        price: data.price,
        variants: data.variants || [],
        sizeGuideImage: data.sizeGuideImage,
        offer: data.offer && data.offer.value > 0 ? data.offer : undefined,
      } as Product);
    });

    cache[cacheKey] = { data: products, ts: Date.now() };

    return NextResponse.json(products, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (err: any) {
    console.error('[products] Error:', err.message);
    return NextResponse.json({ error: 'Error cargando productos' }, { status: 500 });
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getCacheTTL } from '@/lib/cache-config';
import { blacklistedProductIds, blacklistedCategories } from '@/config';
import type { Product } from '@/types';

let cache: Record<string, { data: Product[]; ts: number }> = {};

/**
 * Lee la lista de categorías que el admin marcó como ocultas en
 * config/webSettings.hiddenCategories desde el POS. Cada item es
 * "Gender|||Category" — separamos por gender porque "CHAQUETAS"
 * puede existir en Hombre Y Mujer y el admin puede querer ocultar
 * solo una de las dos. Devuelve un Set para lookups O(1).
 */
async function getHiddenCategoryKeys(): Promise<Set<string>> {
  try {
    const snap = await adminDb.collection('config').doc('webSettings').get();
    if (!snap.exists) return new Set();
    const data = snap.data();
    if (!Array.isArray(data?.hiddenCategories)) return new Set();
    return new Set<string>(data.hiddenCategories);
  } catch {
    return new Set();
  }
}

export async function GET(request: NextRequest) {
  const gender = request.nextUrl.searchParams.get('gender') || undefined;
  const cacheKey = gender || 'all';
  const TTL = await getCacheTTL();

  // hiddenCategories se lee en CADA request (es liviano: 1 solo doc)
  // para que el toggle del POS tenga efecto inmediato. La lista de
  // productos sí queda cacheada por TTL, pero el filtro post-cache
  // permite ocultar categorías al instante.
  const hiddenKeys = await getHiddenCategoryKeys();

  // Helper: aplicar filtro de hiddenCategories sobre una lista de
  // productos ya construida (de cache o fresh). Devuelve nueva array.
  const filterHidden = (list: Product[]): Product[] => {
    if (hiddenKeys.size === 0) return list;
    return list.filter((p) => {
      const key = `${p.gender}|||${p.category}`;
      return !hiddenKeys.has(key);
    });
  };

  if (cache[cacheKey] && Date.now() - cache[cacheKey].ts < TTL) {
    return NextResponse.json(filterHidden(cache[cacheKey].data));
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
      if (data.active === false) return;

      products.push({
        id,
        name: data.name || 'SIN NOMBRE',
        description: data.description || '',
        category: data.category?.trim() || '',
        gender: data.gender || 'Hombre',
        imageUrl: data.imageUrl || '',
        images: data.imageUrls?.length ? data.imageUrls : (data.imageUrl ? [data.imageUrl] : []),
        price: data.price,
        variants: data.variants || [],
        sizeGuideImage: data.sizeGuideImage,
        offer: data.offer && data.offer.value > 0 ? data.offer : undefined,
      } as Product);
    });

    // Cacheamos la lista COMPLETA (sin el filtro de hidden) para que
    // si el admin cambia los toggles, no haya que invalidar cache.
    cache[cacheKey] = { data: products, ts: Date.now() };

    return NextResponse.json(filterHidden(products), {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (err: any) {
    console.error('[products] Error:', err.message);
    return NextResponse.json({ error: 'Error cargando productos' }, { status: 500 });
  }
}

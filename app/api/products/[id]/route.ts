import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { blacklistedProductIds, blacklistedCategories } from '@/config';
import type { Product } from '@/types';

// Cache en memoria (3 minutos TTL)
const cache: Record<string, { data: Product; ts: number }> = {};
const TTL = 3 * 60 * 1000;

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  if (!id || id.length > 40) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  // Check cache
  if (cache[id] && Date.now() - cache[id].ts < TTL) {
    return NextResponse.json(cache[id].data);
  }

  try {
    const doc = await adminDb.collection('products').doc(id).get();

    if (!doc.exists) {
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
    }

    if (blacklistedProductIds.has(id)) {
      return NextResponse.json({ error: 'Producto no disponible' }, { status: 404 });
    }

    const data = doc.data()!;
    const category = (data.category || '').trim().toUpperCase();

    if (blacklistedCategories.has(category)) {
      return NextResponse.json({ error: 'Producto no disponible' }, { status: 404 });
    }

    const product: Product = {
      id,
      name: data.name || 'SIN NOMBRE',
      category: data.category?.trim() || '',
      gender: data.gender || 'Hombre',
      imageUrl: data.imageUrl || '',
      price: data.price,
      variants: data.variants || [],
      sizeGuideImage: data.sizeGuideImage,
    };

    cache[id] = { data: product, ts: Date.now() };

    return NextResponse.json(product, {
      headers: { 'Cache-Control': 'private, no-store' },
    });
  } catch (err: any) {
    console.error('[product/:id] Error:', err.message);
    return NextResponse.json({ error: 'Error cargando producto' }, { status: 500 });
  }
}
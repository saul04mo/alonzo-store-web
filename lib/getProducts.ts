/**
 * Fetch de productos desde Firestore — SOLO SERVER.
 *
 * Fuente única de verdad del mapeo Firestore → Product. Antes esta misma
 * lógica vivía inline dentro de app/api/products/route.ts; ahora la usan
 * tanto la API route (fetch del cliente) como el Server Component de la
 * home (render inicial con productos desde el primer byte de HTML).
 */
import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { adminDb } from '@/lib/firebase-admin';
import { blacklistedProductIds, blacklistedCategories } from '@/config';
import type { Product } from '@/types';

/** Mapeo Firestore doc → Product. Compartido por lista y detalle. */
function mapProduct(id: string, data: any): Product {
  return {
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
  } as Product;
}

/**
 * Lee y mapea los productos de Firestore. Sin caché — cada llamada pega
 * a Firestore. Usar getCachedProducts() para el render del servidor.
 */
export async function fetchProductsFromFirestore(gender?: string): Promise<Product[]> {
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

    products.push(mapProduct(id, data));
  });

  return products;
}

/** Lee un producto por id desde Firestore (sin caché). null si no existe
 *  o está oculto (blacklist / categoría bloqueada / inactivo). */
async function fetchProductByIdFromFirestore(id: string): Promise<Product | null> {
  const doc = await adminDb.collection('products').doc(id).get();
  if (!doc.exists) return null;
  if (blacklistedProductIds.has(id)) return null;

  const data = doc.data()!;
  const category = (data.category || '').trim().toUpperCase();
  if (blacklistedCategories.has(category)) return null;
  if (data.active === false) return null;

  return mapProduct(id, data);
}

/**
 * Producto por id para Server Components. Doble capa de caché:
 *  - React cache(): deduplica dentro de un mismo request, así
 *    generateMetadata y el render de la página comparten UN solo read.
 *  - unstable_cache(): persiste entre requests (revalida cada 30s).
 */
export const getProductById = cache((id: string): Promise<Product | null> =>
  unstable_cache(
    () => fetchProductByIdFromFirestore(id),
    ['product', id],
    { revalidate: 30, tags: ['products', `product-${id}`] }
  )()
);

/**
 * Versión cacheada para Server Components (render inicial de la home).
 * unstable_cache persiste el resultado en la capa de datos de Next y lo
 * revalida cada 30s — reemplaza el viejo `let cache` en memoria del
 * proceso, que en serverless se perdía en cada cold start.
 */
export function getCachedProducts(gender?: string): Promise<Product[]> {
  const key = gender || 'all';
  return unstable_cache(
    () => fetchProductsFromFirestore(gender),
    ['products', key],
    { revalidate: 30, tags: ['products'] }
  )();
}

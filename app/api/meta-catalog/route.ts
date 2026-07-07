import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { getCachedProducts } from '@/lib/getProducts';
import { productHref } from '@/lib/productUrl';
import type { Product } from '@/types';

export const runtime = 'nodejs';

// Feed de productos para el Catálogo de Meta (formato Google/Meta RSS).
//
// Meta consume esta URL de forma programada y arma/actualiza el catálogo solo.
// Lo CLAVE: el <g:id> de cada item es el MISMO `product.id` que el Pixel manda
// en content_ids → así Meta enlaza vistas, carrito y compras por producto, y
// obtienes métricas por producto + anuncios dinámicos de retargeting.
//
// Cómo conectarlo en Meta:
//   Administrador de comercio → Catálogo → Orígenes de datos → Feed de datos →
//   "Usar una URL" → pegar:  https://alonzocollection.com/api/meta-catalog
//   Programar actualización (diaria u horaria). Moneda: USD.

const SITE_URL = 'https://alonzocollection.com';

// Escapa caracteres reservados de XML para que el feed no se rompa con nombres
// o descripciones que tengan &, <, >, comillas, etc.
function xmlEscape(s: string): string {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Lee las categorías que el admin ocultó desde el POS (mismo criterio que
// /api/products) para NO anunciar productos que están ocultos en la web.
async function getHiddenCategoryKeys(): Promise<Set<string>> {
  try {
    const snap = await adminDb.collection('config').doc('webSettings').get();
    const data = snap.data();
    if (!Array.isArray(data?.hiddenCategories)) return new Set();
    return new Set<string>(data.hiddenCategories);
  } catch {
    return new Set();
  }
}

// Precio base del producto (con variantes usa la 1ª; si no, el precio simple).
function basePrice(p: Product): number {
  const raw = p.variants.length ? p.variants[0].price : p.price;
  return parseFloat(raw || '0') || 0;
}

// Precio con oferta aplicada (o null si no hay oferta válida).
function salePrice(p: Product, base: number): number | null {
  if (!p.offer || p.offer.value <= 0) return null;
  const discounted =
    p.offer.type === 'percentage'
      ? base - (base * p.offer.value) / 100
      : Math.max(0, base - p.offer.value);
  return discounted < base && discounted > 0 ? discounted : null;
}

// Disponibilidad: si hay variantes, "in stock" cuando al menos una tiene stock;
// los productos simples (sin variantes) se asumen disponibles.
function availability(p: Product): 'in stock' | 'out of stock' {
  if (!p.variants.length) return 'in stock';
  const hasStock = p.variants.some((v) => (parseInt(v.stock) || 0) > 0);
  return hasStock ? 'in stock' : 'out of stock';
}

function absoluteUrl(url: string): string {
  if (!url) return '';
  return url.startsWith('http') ? url : `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

function itemXml(p: Product): string {
  const base = basePrice(p);
  if (base <= 0) return ''; // Meta exige precio > 0; saltamos productos sin precio

  const image = absoluteUrl(p.imageUrl);
  if (!image) return ''; // imagen obligatoria

  const sale = salePrice(p, base);
  const link = `${SITE_URL}${productHref(p)}`;
  const description = p.description?.trim() || p.name;
  const productType = [p.gender, p.category].filter(Boolean).join(' > ');

  // Imágenes adicionales (hasta 10 según la spec; mandamos las que haya menos
  // la principal).
  const extraImages = p.images
    .filter((img) => img && absoluteUrl(img) !== image)
    .slice(0, 10)
    .map((img) => `    <g:additional_image_link>${xmlEscape(absoluteUrl(img))}</g:additional_image_link>`)
    .join('\n');

  return [
    '  <item>',
    `    <g:id>${xmlEscape(p.id)}</g:id>`,
    `    <g:title>${xmlEscape(p.name.slice(0, 150))}</g:title>`,
    `    <g:description>${xmlEscape(description.slice(0, 5000))}</g:description>`,
    `    <g:link>${xmlEscape(link)}</g:link>`,
    `    <g:image_link>${xmlEscape(image)}</g:image_link>`,
    extraImages,
    `    <g:availability>${availability(p)}</g:availability>`,
    '    <g:condition>new</g:condition>',
    `    <g:price>${base.toFixed(2)} USD</g:price>`,
    sale ? `    <g:sale_price>${sale.toFixed(2)} USD</g:sale_price>` : '',
    '    <g:brand>ALONZO</g:brand>',
    productType ? `    <g:product_type>${xmlEscape(productType)}</g:product_type>` : '',
    '  </item>',
  ]
    .filter(Boolean)
    .join('\n');
}

export async function GET() {
  try {
    const [products, hiddenKeys] = await Promise.all([
      getCachedProducts(),
      getHiddenCategoryKeys(),
    ]);

    const visible = products.filter(
      (p) => !hiddenKeys.has(`${p.gender}|||${p.category}`),
    );

    const items = visible.map(itemXml).filter(Boolean).join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
  <title>ALONZO Store</title>
  <link>${SITE_URL}</link>
  <description>Catálogo de productos ALONZO Store</description>
${items}
</channel>
</rss>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        // Meta lo descarga periódicamente; cacheamos 1h en el edge para no pegar
        // a Firestore en cada fetch.
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    });
  } catch (err: any) {
    console.error('[meta-catalog] Error:', err.message);
    return new NextResponse('Error generando el feed', { status: 500 });
  }
}

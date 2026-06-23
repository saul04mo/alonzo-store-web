import type { Metadata } from 'next';
import { getProductById } from '@/lib/getProducts';
import { extractProductId } from '@/lib/productUrl';
import { ProductDetailClient } from './ProductDetailClient';

interface Props {
  params: { id: string };
}

// Dynamic OG metadata per product.
// Usa getProductById (React cache) — comparte el read de Firestore con
// el render de Page de abajo, así es UN solo read por request.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const id = extractProductId(params.id);
    const product = await getProductById(id);
    if (!product) return { title: 'Producto no encontrado' };

    const price = product.variants?.[0]?.price || product.price || '0';
    const image = product.imageUrl || '/images/og-image.jpg';
    const desc = product.description
      ? `${product.description} — ${parseFloat(price).toFixed(2)} en ALONZO Store.`
      : `${product.name} de la colección ${product.category}. ${parseFloat(price).toFixed(2)} — Compra en ALONZO Store.`;

    return {
      title: product.name,
      description: desc,
      openGraph: {
        title: `${product.name} — ALONZO Store`,
        description: desc,
        images: [{ url: image, width: 800, height: 1000, alt: product.name }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.name} — ALONZO Store`,
        description: `${product.name} — ${parseFloat(price).toFixed(2)}`,
        images: [image],
      },
    };
  } catch {
    return { title: 'ALONZO Store' };
  }
}

export default async function Page({ params }: Props) {
  const id = extractProductId(params.id);
  // Producto desde el servidor → la imagen (con priority) ya viaja en el
  // HTML inicial; sin esperar un fetch del cliente tras montar.
  const initialProduct = await getProductById(id).catch(() => null);
  return <ProductDetailClient id={id} initialProduct={initialProduct} />;
}

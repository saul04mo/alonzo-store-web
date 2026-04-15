import type { Metadata } from 'next';
import { adminDb } from '@/lib/firebase-admin';
import { blacklistedProductIds, blacklistedCategories } from '@/config';
import { ProductDetailClient } from './ProductDetailClient';

interface Props {
  params: { id: string };
}

// Dynamic OG metadata per product
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const doc = await adminDb.collection('products').doc(params.id).get();
    if (!doc.exists) return { title: 'Producto no encontrado' };

    const data = doc.data()!;
    const name = data.name || 'Producto';
    const category = data.category || '';
    const price = data.variants?.[0]?.price || data.price || '0';
    const image = data.imageUrl || '/images/og-image.jpg';

    return {
      title: name,
      description: `${name} de la colección ${category}. €${parseFloat(price).toFixed(2)} — Compra en ALONZO Store.`,
      openGraph: {
        title: `${name} — ALONZO Store`,
        description: `${name} de la colección ${category}. €${parseFloat(price).toFixed(2)}`,
        images: [{ url: image, width: 800, height: 1000, alt: name }],
        type: 'website',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${name} — ALONZO Store`,
        description: `${name} — €${parseFloat(price).toFixed(2)}`,
        images: [image],
      },
    };
  } catch {
    return { title: 'ALONZO Store' };
  }
}

export default function Page({ params }: Props) {
  return <ProductDetailClient id={params.id} />;
}

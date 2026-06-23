import type { MetadataRoute } from 'next';
import { adminDb } from '@/lib/firebase-admin';
import { productHref } from '@/lib/productUrl';

const SITE_URL = 'https://alonzocollection.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/search`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE_URL}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
  ];

  // Add all active products
  try {
    const snap = await adminDb.collection('products').where('active', '!=', false).get();
    snap.forEach((doc) => {
      pages.push({
        url: `${SITE_URL}${productHref({ id: doc.id, name: doc.data().name, category: doc.data().category })}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    });
  } catch (e) {
    console.error('Sitemap error:', e);
  }

  return pages;
}

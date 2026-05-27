/**
 * Server-side fetcher de config/webSettings.
 *
 * Se usa en Server Components (app/page.tsx) para pre-renderizar el
 * HeroBanner con la URL real del banner desde el primer byte de HTML.
 * Sin esto, el cliente arranca con DEFAULTS (imagen estática local) y
 * recién después de que el onSnapshot de Firestore devuelve la data
 * real se actualiza la imagen — generando el flash visible al hacer
 * F5 que reportó el cliente.
 *
 * Cache server-side de 30 segundos para no martillar Firestore en
 * cada request (Netlify puede hacer SSR de cada request si la página
 * está marcada como dinámica). Si necesitás invalidación inmediata,
 * tendrías que llamar a `invalidateServerSettingsCache()`.
 */
import { adminDb } from '@/lib/firebase-admin';

export interface ServerWebSettings {
  heroSubtitle: string;
  heroImage: string;
  heroImageMobile: string;
  heroImages: string[];
  heroImagesMobile: string[];
  heroSlideInterval: number;
  whatsappNumber: string;
  currencySymbol: string;
}

const DEFAULTS: ServerWebSettings = {
  heroSubtitle: 'Newest Collection',
  heroImage: '/images/hero-banner.jpg',
  heroImageMobile: '',
  heroImages: ['/images/hero-banner.jpg'],
  heroImagesMobile: [],
  heroSlideInterval: 6,
  whatsappNumber: '584123380976',
  currencySymbol: '€',
};

const TTL_MS = 30 * 1000;
let cached: { value: ServerWebSettings; ts: number } | null = null;

export async function getServerWebSettings(): Promise<ServerWebSettings> {
  // Cache hit
  if (cached && Date.now() - cached.ts < TTL_MS) {
    return cached.value;
  }

  try {
    const snap = await adminDb.collection('config').doc('webSettings').get();
    if (snap.exists) {
      const d = snap.data() || {};
      const heroImagesArr: string[] =
        Array.isArray(d.heroImages) && d.heroImages.length
          ? d.heroImages
          : d.heroImage
          ? [d.heroImage]
          : DEFAULTS.heroImages;
      const heroImagesMobileArr: string[] =
        Array.isArray(d.heroImagesMobile) && d.heroImagesMobile.length
          ? d.heroImagesMobile
          : d.heroImageMobile
          ? [d.heroImageMobile]
          : [];
      const merged: ServerWebSettings = {
        heroSubtitle: d.heroSubtitle || DEFAULTS.heroSubtitle,
        heroImage: heroImagesArr[0] || DEFAULTS.heroImage,
        heroImageMobile: heroImagesMobileArr[0] || '',
        heroImages: heroImagesArr,
        heroImagesMobile: heroImagesMobileArr,
        heroSlideInterval: typeof d.heroSlideInterval === 'number' ? d.heroSlideInterval : DEFAULTS.heroSlideInterval,
        whatsappNumber: d.whatsappNumber || DEFAULTS.whatsappNumber,
        currencySymbol: d.currencySymbol || DEFAULTS.currencySymbol,
      };
      cached = { value: merged, ts: Date.now() };
      return merged;
    }
  } catch (e) {
    console.error('[getServerWebSettings] error:', e);
  }

  cached = { value: DEFAULTS, ts: Date.now() };
  return DEFAULTS;
}

export function invalidateServerSettingsCache(): void {
  cached = null;
}

'use client';
import { useState, useEffect } from 'react';
import { db, doc, onSnapshot } from '@/lib/firebase-client';

export interface WebSettings {
  whatsappNumber: string;
  currency: string;
  currencySymbol: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;         // primer elemento de heroImages (compat)
  heroImageMobile: string;   // primer elemento de heroImagesMobile (compat)
  heroImages: string[];      // carrusel desktop
  heroImagesMobile: string[]; // carrusel móvil
  heroSlideInterval: number; // segundos entre slides
  installPromptEnabled: boolean;
  cacheTTL: number;
}

const DEFAULTS: WebSettings = {
  whatsappNumber: '584123380976',
  currency: 'EUR',
  currencySymbol: '€',
  heroTitle: 'ALONZO',
  heroSubtitle: 'Newest Collection',
  heroImage: '/images/hero-banner.jpg',
  heroImageMobile: '',
  heroImages: ['/images/hero-banner.jpg'],
  heroImagesMobile: [],
  heroSlideInterval: 6,
  installPromptEnabled: false,
  cacheTTL: 30,
};

let snapshot: WebSettings | null = null;
let initialized = false;
let unsubscribe: (() => void) | null = null;
const listeners = new Set<(s: WebSettings) => void>();

function ensureSubscribed() {
  if (initialized) return;
  initialized = true;
  try {
    unsubscribe = onSnapshot(
      doc(db, 'config', 'webSettings'),
      (snap) => {
        if (snap.exists()) {
          const d = snap.data();

          // Backward compat: si hay array heroImages úsalo, si no envuelve el campo legacy
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

          snapshot = {
            whatsappNumber: d.whatsappNumber || DEFAULTS.whatsappNumber,
            currency: d.currency || DEFAULTS.currency,
            currencySymbol: d.currencySymbol || DEFAULTS.currencySymbol,
            heroTitle: d.heroTitle || DEFAULTS.heroTitle,
            heroSubtitle: d.heroSubtitle || DEFAULTS.heroSubtitle,
            heroImage: heroImagesArr[0] || DEFAULTS.heroImage,
            heroImageMobile: heroImagesMobileArr[0] || '',
            heroImages: heroImagesArr,
            heroImagesMobile: heroImagesMobileArr,
            heroSlideInterval:
              typeof d.heroSlideInterval === 'number' ? d.heroSlideInterval : DEFAULTS.heroSlideInterval,
            installPromptEnabled: d.installPromptEnabled === true,
            cacheTTL: typeof d.cacheTTL === 'number' ? d.cacheTTL : DEFAULTS.cacheTTL,
          };
        } else {
          snapshot = DEFAULTS;
        }
        listeners.forEach((l) => l(snapshot!));
      },
      (err) => {
        console.error('[useWebSettings] onSnapshot error:', err);
        if (!snapshot) {
          snapshot = DEFAULTS;
          listeners.forEach((l) => l(snapshot!));
        }
      },
    );
  } catch (e) {
    console.error('[useWebSettings] No se pudo iniciar listener:', e);
    snapshot = DEFAULTS;
  }
}

export function invalidateWebSettingsCache(): void {
  if (unsubscribe) {
    try { unsubscribe(); } catch {}
  }
  snapshot = null;
  initialized = false;
  unsubscribe = null;
  listeners.clear();
}

export function useWebSettings(): WebSettings & { loaded: boolean } {
  const [settings, setSettings] = useState<WebSettings>(snapshot || DEFAULTS);
  const [isLoaded, setIsLoaded] = useState(snapshot !== null);

  useEffect(() => {
    ensureSubscribed();

    if (snapshot) {
      setSettings(snapshot);
      setIsLoaded(true);
    }

    const listener = (s: WebSettings) => {
      setSettings(s);
      setIsLoaded(true);
    };
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  return { ...settings, loaded: isLoaded };
}

export function getWebSettings(): WebSettings {
  return snapshot || DEFAULTS;
}

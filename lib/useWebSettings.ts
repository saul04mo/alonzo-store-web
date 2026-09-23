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
  heroImage: '',
  heroImageMobile: '',
  // Sin imagen de relleno: si no hay banner configurado (o falla Firestore)
  // se ve el fondo gris del hero, nunca una foto vieja que luego cambia.
  heroImages: [],
  heroImagesMobile: [],
  heroSlideInterval: 6,
  installPromptEnabled: false,
  cacheTTL: 30,
};

let snapshot: WebSettings | null = null;
let initialized = false;
let unsubscribe: (() => void) | null = null;
const listeners = new Set<(s: WebSettings) => void>();

/**
 * `true` sólo cuando llegó el onSnapshot REAL de Firestore.
 *
 * No confundir con `snapshot !== null`: primeWebSettings() siembra un
 * snapshot parcial (sólo los campos que el layout le pasa) completado con
 * DEFAULTS. Si `loaded` se derivara de que exista snapshot, un consumidor
 * que use el flag para decidir entre "valor del servidor" y "valor del
 * hook" elegiría el del hook — que para los campos NO sembrados sigue
 * siendo DEFAULTS. Eso hacía que el HeroBanner descartara la imagen real
 * del SSR y pintara la imagen por defecto hasta que llegaba Firestore.
 */
let hydrated = false;

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
        hydrated = true;
        listeners.forEach((l) => l(snapshot!));
      },
      (err) => {
        console.error('[useWebSettings] onSnapshot error:', err);
        // A propósito NO se marca hydrated: si Firestore falla, lo mejor que
        // tenemos son los valores que el servidor ya renderizó, así que los
        // consumidores deben seguir prefiriéndolos antes que estos DEFAULTS.
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

/**
 * Siembra el snapshot con los valores que el servidor ya leyó de Firestore,
 * para que el PRIMER render del cliente (y el HTML del SSR) usen la config
 * real en vez de DEFAULTS. Sin esto la página pinta con DEFAULTS (símbolo €)
 * y solo se corrige ~300ms después, cuando llega el onSnapshot — y únicamente
 * en los componentes que estén suscritos.
 *
 * No pisa un snapshot ya existente: el listener de Firestore siempre manda.
 */
export function primeWebSettings(partial: Partial<WebSettings>): void {
  if (snapshot) return;
  snapshot = { ...DEFAULTS, ...partial };
}

export function invalidateWebSettingsCache(): void {
  if (unsubscribe) {
    try { unsubscribe(); } catch {}
  }
  snapshot = null;
  initialized = false;
  hydrated = false;
  unsubscribe = null;
  listeners.clear();
}

export function useWebSettings(): WebSettings & { loaded: boolean } {
  const [settings, setSettings] = useState<WebSettings>(snapshot || DEFAULTS);
  const [isLoaded, setIsLoaded] = useState(hydrated);

  useEffect(() => {
    ensureSubscribed();

    if (snapshot) {
      setSettings(snapshot);
      setIsLoaded(hydrated);
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

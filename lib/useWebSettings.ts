'use client';
import { useState, useEffect } from 'react';
import { db, doc, getDoc } from '@/lib/firebase-client';

export interface WebSettings {
  whatsappNumber: string;
  currency: string;
  currencySymbol: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
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
  installPromptEnabled: false,
  cacheTTL: 30,
};

// CACHE STRATEGY: las settings se leen UNA vez al cargar y se cachean
// en memoria del módulo durante esa sesión del browser. Pero si el
// admin cambia algo (ej: prompt de instalación PWA) en otra pestaña/POS,
// el usuario tiene que hacer F5 para refrescar.
// El cache se invalida automáticamente al cerrar/recargar la página.
let cached: WebSettings | null = null;
let loaded = false;

/**
 * Helper para reset manual del cache si hace falta forzar relectura.
 * Útil después de cambios desde panel admin (no usado por el flujo normal).
 */
export function invalidateWebSettingsCache(): void {
  cached = null;
  loaded = false;
}

export function useWebSettings(): WebSettings & { loaded: boolean } {
  const [settings, setSettings] = useState<WebSettings>(cached || DEFAULTS);
  const [isLoaded, setIsLoaded] = useState(loaded);

  useEffect(() => {
    if (cached) { setIsLoaded(true); return; }
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'webSettings'));
        if (snap.exists()) {
          const d = snap.data();
          // installPromptEnabled: solo es TRUE si Firestore lo dice
          // explícitamente true. Si es false, undefined, o cualquier
          // otra cosa, default a false para evitar mostrar el banner
          // a usuarios que ya lo tienen apagado.
          const merged: WebSettings = {
            whatsappNumber: d.whatsappNumber || DEFAULTS.whatsappNumber,
            currency: d.currency || DEFAULTS.currency,
            currencySymbol: d.currencySymbol || DEFAULTS.currencySymbol,
            heroTitle: d.heroTitle || DEFAULTS.heroTitle,
            heroSubtitle: d.heroSubtitle || DEFAULTS.heroSubtitle,
            heroImage: d.heroImage || DEFAULTS.heroImage,
            installPromptEnabled: d.installPromptEnabled === true,
            cacheTTL: typeof d.cacheTTL === 'number' ? d.cacheTTL : DEFAULTS.cacheTTL,
          };
          cached = merged;
          setSettings(merged);
        } else {
          cached = DEFAULTS;
        }
      } catch {
        cached = DEFAULTS;
      }
      loaded = true;
      setIsLoaded(true);
    })();
  }, []);

  return { ...settings, loaded: isLoaded };
}

// For non-hook contexts (format functions)
export function getWebSettings(): WebSettings {
  return cached || DEFAULTS;
}

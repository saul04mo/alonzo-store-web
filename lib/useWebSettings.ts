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
  installPromptEnabled: true,
  cacheTTL: 30,
};

let cached: WebSettings | null = null;
let loaded = false;

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
          const merged: WebSettings = {
            whatsappNumber: d.whatsappNumber || DEFAULTS.whatsappNumber,
            currency: d.currency || DEFAULTS.currency,
            currencySymbol: d.currencySymbol || DEFAULTS.currencySymbol,
            heroTitle: d.heroTitle || DEFAULTS.heroTitle,
            heroSubtitle: d.heroSubtitle || DEFAULTS.heroSubtitle,
            heroImage: d.heroImage || DEFAULTS.heroImage,
            installPromptEnabled: d.installPromptEnabled !== false,
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

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

export function useWebSettings(): WebSettings {
  const [settings, setSettings] = useState<WebSettings>(cached || DEFAULTS);

  useEffect(() => {
    if (cached) return;
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
        }
      } catch {
        // Use defaults
      }
    })();
  }, []);

  return settings;
}

// For non-hook contexts (format functions)
export function getWebSettings(): WebSettings {
  return cached || DEFAULTS;
}

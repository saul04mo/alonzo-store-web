'use client';
import { useState, useEffect } from 'react';
import { db, doc, onSnapshot } from '@/lib/firebase-client';

export interface WebSettings {
  whatsappNumber: string;
  currency: string;
  currencySymbol: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImage: string;
  heroImageMobile: string;
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
  installPromptEnabled: false,
  cacheTTL: 30,
};

// ── Suscripción realtime compartida entre todos los hooks ──────────
// Antes esto era un getDoc() one-shot con cache singleton en memoria.
// Problema: cuando el admin cambiaba un valor desde el POS (ej. la
// imagen del banner), el cliente que ya tenía la página abierta no
// veía el cambio NUNCA — el cache solo se invalidaba al cerrar la
// pestaña, y aún con F5 el HTML cacheado por Netlify/Service Worker
// podía servir lo viejo.
//
// Solución: onSnapshot. UN listener compartido por toda la sesión del
// browser, y todos los hooks useWebSettings se enteran de los cambios
// automáticamente. Costo: 1 conexión de lectura mientras la pestaña
// esté abierta (insignificante para 1 doc tan chico).
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
          snapshot = {
            whatsappNumber: d.whatsappNumber || DEFAULTS.whatsappNumber,
            currency: d.currency || DEFAULTS.currency,
            currencySymbol: d.currencySymbol || DEFAULTS.currencySymbol,
            heroTitle: d.heroTitle || DEFAULTS.heroTitle,
            heroSubtitle: d.heroSubtitle || DEFAULTS.heroSubtitle,
            heroImage: d.heroImage || DEFAULTS.heroImage,
            heroImageMobile: d.heroImageMobile || '',
            installPromptEnabled: d.installPromptEnabled === true,
            cacheTTL: typeof d.cacheTTL === 'number' ? d.cacheTTL : DEFAULTS.cacheTTL,
          };
        } else {
          snapshot = DEFAULTS;
        }
        // Notificar a TODOS los componentes suscritos
        listeners.forEach((l) => l(snapshot!));
      },
      (err) => {
        console.error('[useWebSettings] onSnapshot error:', err);
        // En caso de error usamos defaults para no romper la UI
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

/** Reset manual del cache + listener. Útil para tests o cleanup explícito. */
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

    // Si ya hay snapshot, sincronizamos el estado local inmediatamente
    if (snapshot) {
      setSettings(snapshot);
      setIsLoaded(true);
    }

    // Suscribirse a futuros cambios
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

// For non-hook contexts (format functions)
export function getWebSettings(): WebSettings {
  return snapshot || DEFAULTS;
}

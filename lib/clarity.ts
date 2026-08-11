'use client';

import { useEffect } from 'react';

// Microsoft Clarity — identificación de vistas.
//
// Clarity agrupa las grabaciones por URL, y eso no alcanza en esta tienda:
//   1. El catálogo por categoría/género vive en la MISMA ruta ("/") con query
//      params, así que media sesión se reporta como "alonzocollection.com".
//   2. Varias vistas son modales sin ruta propia (carrito lateral, login,
//      pedido confirmado), y para Clarity ni siquiera existen.
// Por eso le pasamos nosotros un nombre legible en cada cambio de vista.
// Ver components/Clarity.tsx (rutas) y las llamadas a clarityView() en modales.

type ClarityFn = (...args: unknown[]) => void;

function getClarity(): ClarityFn | null {
  if (typeof window === 'undefined') return null;
  const c = (window as unknown as { clarity?: ClarityFn }).clarity;
  // El snippet define una función-cola apenas corre, así que las llamadas
  // previas a que cargue el tag se encolan solas. Si no existe, Clarity está
  // deshabilitado (sin NEXT_PUBLIC_CLARITY_ID) y no hacemos nada.
  return typeof c === 'function' ? c : null;
}

/**
 * Etiqueta personalizada. Aparece como filtro en el dashboard y como evento en
 * la línea de tiempo de la grabación.
 */
export function clarityTag(key: string, value: string): void {
  const c = getClarity();
  if (!c || !value) return;
  try {
    c('set', key, value);
  } catch {
    /* Clarity nunca debe romper la app */
  }
}

// Clarity exige un custom-id para poder fijar el nombre de página. Usamos un
// UUID opaco por navegador (no es PII, no viaja al servidor); Clarity además lo
// hashea antes de guardarlo. Sirve para reconocer al mismo visitante entre
// sesiones. Si el usuario bloquea el storage, seguimos sin identificar.
const CID_KEY = 'alonzo_cid';

function deviceId(): string | null {
  try {
    let id = localStorage.getItem(CID_KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(CID_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

// Última vista de RUTA. Cuando se cierra un modal hay que devolverle a Clarity
// el nombre de la página que quedó debajo, o el resto de la sesión seguiría
// reportándose como "Pedido confirmado".
let lastRoute: { name: string; id?: string } | null = null;
let isOverlay = false;

/**
 * Nombra la vista actual en Clarity. `name` es lo que se verá en la grabación
 * en vez de la URL cruda; `id` agrupa las vistas equivalentes entre sesiones.
 */
export function clarityView(name: string, id?: string): void {
  const c = getClarity();
  if (!c || !name) return;
  if (!isOverlay) lastRoute = { name, id };
  const pageId = (id || name)
    .toLowerCase()
    // NFD separa la tilde de la letra; luego descartamos todo lo no-ASCII, así
    // "Categoría" queda "categoria" y no "categor-a".
    .normalize('NFD')
    .replace(/[^\x00-\x7f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

  try {
    // Etiqueta: filtrable en el dashboard ("Vista = Carrito").
    c('set', 'Vista', name);
    const cid = deviceId();
    // identify(custom-id, custom-session-id, custom-page-id, friendly-name).
    // El nombre amigable es lo que reemplaza a la URL en la grabación.
    if (cid) c('identify', cid, null, pageId, name);
  } catch {
    /* Clarity nunca debe romper la app */
  }
}

/**
 * Nombra una vista que NO tiene ruta propia: modales y paneles (carrito
 * lateral, login, pedido confirmado). Al cerrarse restaura el nombre de la
 * página de fondo. Pasa `name: null` mientras esté cerrada.
 */
export function useClarityOverlay(name: string | null, id?: string): void {
  useEffect(() => {
    if (!name) return;
    isOverlay = true;
    clarityView(name, id);
    return () => {
      isOverlay = false;
      if (lastRoute) clarityView(lastRoute.name, lastRoute.id);
    };
  }, [name, id]);
}

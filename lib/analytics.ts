'use client';

import { getAnalyticsInstance } from '@/lib/firebase-client';
import type { CartItem } from '@/types';

/**
 * Envía un evento personalizado a Firebase Analytics (GA4).
 *
 * Para interacciones que NO son cambios de página (filtros, scroll, toggles,
 * y todo el embudo de e-commerce: add_to_cart, begin_checkout, purchase...).
 * Ojo: estas cosas no deben registrarse como `page_view` — inflarían el
 * reporte de "páginas más vistas", que es justo el problema que arreglamos
 * en components/Analytics.tsx.
 *
 * No-op si Analytics está deshabilitado (sin measurementId) o si corre en
 * el servidor. Nunca lanza: un fallo de telemetría jamás debe romper la UI.
 */
export async function trackEvent(
  name: string,
  params?: Record<string, unknown>
): Promise<void> {
  if (typeof window === 'undefined') return;
  if (!process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) return;

  try {
    const analytics = await getAnalyticsInstance();
    if (!analytics) return;

    const { logEvent } = await import('firebase/analytics');
    logEvent(analytics, name, params);
  } catch {
    // Silencio intencional — la telemetría no es crítica.
  }
}

/* ══════════════════════════════════════════════════════════════════════════
   E-COMMERCE (GA4)

   GA4 tiene un conjunto de eventos "recomendados" de e-commerce con un formato
   MUY específico: cada uno lleva `currency`, `value` y un array `items` con
   campos estándar (item_id, item_name, price, quantity, discount...). Solo si
   respetamos ese formato exacto, Google puebla los reportes de Monetización
   (ingresos, productos más vendidos, embudo de compra, tasa de conversión).

   Referencia oficial de eventos y parámetros:
   https://developers.google.com/analytics/devguides/collection/ga4/reference/events

   Toda la app manda sus eventos de compra por AQUÍ para no repetir el mapeo
   de CartItem -> item de GA4 en cada componente.
   ════════════════════════════════════════════════════════════════════════ */

export const CURRENCY = 'USD';

/** Forma de un ítem tal como GA4 lo espera dentro de `items`. */
export interface Ga4Item {
  item_id: string;
  item_name: string;
  price: number;        // precio unitario CON descuento de oferta aplicado
  quantity: number;
  discount?: number;    // descuento por unidad (0 si no hay oferta)
  item_variant?: string; // talla / color, para el reporte por variante
  index?: number;        // posición en la lista (útil en add_to_cart desde grid)
}

/** Precio unitario ya con la oferta del snapshot aplicada. */
function unitPriceWithOffer(item: Pick<CartItem, 'precio' | 'offer'>): number {
  const base = parseFloat(item.precio) || 0;
  const offer = item.offer;
  if (!offer || offer.value <= 0) return round2(base);
  const discounted =
    offer.type === 'percentage'
      ? base - (base * offer.value) / 100
      : Math.max(0, base - offer.value);
  return round2(discounted);
}

/** Descuento por unidad (0 si no hay oferta). */
function unitDiscount(item: Pick<CartItem, 'precio' | 'offer'>): number {
  const base = parseFloat(item.precio) || 0;
  return round2(base - unitPriceWithOffer(item));
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Etiqueta de variante legible para el reporte por variante de GA4. */
function variantLabel(item: Pick<CartItem, 'size' | 'color'>): string | undefined {
  const parts = [item.size, item.color].filter(Boolean);
  return parts.length ? parts.join(' / ') : undefined;
}

/**
 * Convierte uno o varios CartItem al formato `items` de GA4.
 * Es el único lugar donde vive ese mapeo — reutilízalo siempre.
 */
export function toGa4Items(items: CartItem | CartItem[]): Ga4Item[] {
  const list = Array.isArray(items) ? items : [items];
  return list.map((item, i) => {
    const ga: Ga4Item = {
      item_id: item.productId,
      item_name: item.titulo,
      price: unitPriceWithOffer(item),
      quantity: item.qty,
      index: i,
    };
    const discount = unitDiscount(item);
    if (discount > 0) ga.discount = discount;
    const variant = variantLabel(item);
    if (variant) ga.item_variant = variant;
    return ga;
  });
}

/** Suma (precio con oferta × cantidad) de una lista de ítems. */
export function cartValue(items: CartItem[]): number {
  return round2(
    items.reduce((sum, it) => sum + unitPriceWithOffer(it) * it.qty, 0)
  );
}

/* ── Eventos del embudo ──────────────────────────────────────────────────
   Cada uno es un wrapper delgado sobre trackEvent con el nombre y el formato
   exactos que GA4 reconoce. Todos son "fire and forget" (void). */

/** El visitante ve la ficha de un producto. */
export function gaViewItem(item: CartItem): void {
  void trackEvent('view_item', {
    currency: CURRENCY,
    value: unitPriceWithOffer(item) * item.qty,
    items: toGa4Items(item),
  });
}

/** El visitante agrega uno o más ítems al carrito. */
export function gaAddToCart(items: CartItem | CartItem[]): void {
  const list = Array.isArray(items) ? items : [items];
  void trackEvent('add_to_cart', {
    currency: CURRENCY,
    value: cartValue(list),
    items: toGa4Items(list),
  });
}

/** El visitante quita uno o más ítems del carrito. */
export function gaRemoveFromCart(items: CartItem | CartItem[]): void {
  const list = Array.isArray(items) ? items : [items];
  void trackEvent('remove_from_cart', {
    currency: CURRENCY,
    value: cartValue(list),
    items: toGa4Items(list),
  });
}

/** El visitante abre / mira el carrito completo. */
export function gaViewCart(items: CartItem[]): void {
  void trackEvent('view_cart', {
    currency: CURRENCY,
    value: cartValue(items),
    items: toGa4Items(items),
  });
}

/** El visitante entra al checkout (equivalente al InitiateCheckout de Meta). */
export function gaBeginCheckout(items: CartItem[], coupon?: string): void {
  void trackEvent('begin_checkout', {
    currency: CURRENCY,
    value: cartValue(items),
    coupon: coupon || undefined,
    items: toGa4Items(items),
  });
}

/** El visitante elige método de envío. */
export function gaAddShippingInfo(
  items: CartItem[],
  shipping_tier: string,
  value?: number
): void {
  void trackEvent('add_shipping_info', {
    currency: CURRENCY,
    value: value ?? cartValue(items),
    shipping_tier,
    items: toGa4Items(items),
  });
}

/** El visitante elige método de pago. */
export function gaAddPaymentInfo(
  items: CartItem[],
  payment_type: string,
  value?: number
): void {
  void trackEvent('add_payment_info', {
    currency: CURRENCY,
    value: value ?? cartValue(items),
    payment_type,
    items: toGa4Items(items),
  });
}

/** Parámetros de la conversión final. */
export interface GaPurchaseInfo {
  transaction_id: string; // id de la orden — evita contar dos veces la compra
  value: number;          // total realmente cobrado (con envío y cupón)
  shipping?: number;      // costo de envío
  discount?: number;      // descuento de cupón
  coupon?: string;
}

/** ¡La conversión! Es el evento más importante para GA4. */
export function gaPurchase(items: CartItem[], info: GaPurchaseInfo): void {
  void trackEvent('purchase', {
    transaction_id: info.transaction_id,
    currency: CURRENCY,
    value: round2(info.value),
    shipping: info.shipping ? round2(info.shipping) : undefined,
    coupon: info.coupon || undefined,
    items: toGa4Items(items),
  });
}

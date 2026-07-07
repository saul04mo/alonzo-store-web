// Helper para registrar eventos del Meta Pixel desde cualquier parte de la app
// (componentes cliente). Úsalo en los momentos clave del embudo de compra para
// que Meta pueda optimizar tus campañas y medir el retorno (ROAS).
//
// Ejemplos:
//   trackPixel('ViewContent', { content_ids: [id], content_type: 'product', value: 29.9, currency: 'USD' });
//   trackPixel('AddToCart',   { content_ids: [id], content_type: 'product', value: 29.9, currency: 'USD' });
//   trackPixel('InitiateCheckout', { value: total, currency: 'USD', num_items: items.length });
//   trackPixel('Purchase',    { value: total, currency: 'USD', content_ids: ids, content_type: 'product' });
//
// Si el Pixel no está cargado (sin ID configurado o aún inicializando), la
// llamada simplemente no hace nada — nunca rompe la app.

// Eventos estándar más comunes para e-commerce. Puedes pasar cualquier string
// si necesitas un evento personalizado, pero estos son los que Meta entiende
// de forma nativa para optimización.
type StandardEvent =
  | 'PageView'
  | 'ViewContent'
  | 'Search'
  | 'AddToCart'
  | 'AddToWishlist'
  | 'InitiateCheckout'
  | 'AddPaymentInfo'
  | 'Purchase'
  | 'Lead'
  | 'CompleteRegistration'
  | 'Contact';

export function trackPixel(
  event: StandardEvent,
  data?: Record<string, unknown>,
): void {
  if (typeof window === 'undefined') return;
  window.fbq?.('track', event, data);
}

// Para eventos 100% personalizados que no están en la lista estándar de Meta.
export function trackPixelCustom(
  event: string,
  data?: Record<string, unknown>,
): void {
  if (typeof window === 'undefined') return;
  window.fbq?.('trackCustom', event, data);
}

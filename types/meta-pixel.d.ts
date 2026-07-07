// Declaración global de `fbq`, la función que inyecta el script del Meta Pixel
// en `window`. Sin esto, TypeScript no conoce `window.fbq` y marca error.
export {};

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

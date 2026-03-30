/**
 * Validación de variables de entorno al arrancar.
 * Importar desde layout.tsx o next.config.js.
 */

const requiredPublic = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
] as const;

const requiredServer = [
  // FIREBASE_SERVICE_ACCOUNT_KEY es opcional si se usa ADC
] as const;

export function validateEnv() {
  const missing: string[] = [];

  for (const key of requiredPublic) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  if (missing.length > 0) {
    console.error(
      `⚠️ Missing required environment variables:\n${missing.map((k) => `  - ${k}`).join('\n')}\n` +
      'Create a .env.local file with these values.'
    );
  }

  return missing.length === 0;
}

// Auto-validate on import (server-side only, development)
if (typeof window === 'undefined' && process.env.NODE_ENV === 'development') {
  validateEnv();
}

import { adminDb } from '@/lib/firebase-admin';

// Default TTL: 30 seconds
const DEFAULT_TTL = 30 * 1000;

// Cache the TTL setting itself (refresh every 60s)
let cachedTTL: { value: number; ts: number } | null = null;
const SETTINGS_REFRESH = 60 * 1000;

export async function getCacheTTL(): Promise<number> {
  // Return cached TTL if fresh
  if (cachedTTL && Date.now() - cachedTTL.ts < SETTINGS_REFRESH) {
    return cachedTTL.value;
  }

  try {
    const snap = await adminDb.collection('config').doc('webSettings').get();
    if (snap.exists) {
      const data = snap.data();
      const seconds = data?.cacheTTL;
      if (typeof seconds === 'number' && seconds >= 0) {
        const ms = seconds * 1000;
        cachedTTL = { value: ms, ts: Date.now() };
        return ms;
      }
    }
  } catch {
    // Fail silently, use default
  }

  cachedTTL = { value: DEFAULT_TTL, ts: Date.now() };
  return DEFAULT_TTL;
}

import { NextRequest } from 'next/server';
import { adminAuth } from './firebase-admin';

/**
 * Verifica el token de Firebase Auth desde el header Authorization.
 * Uso en API routes:
 *   const user = await verifyAuth(request);
 *   if (!user) return Response.json({ error: 'No autorizado' }, { status: 401 });
 */
export async function verifyAuth(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.split('Bearer ')[1];
  if (!token) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Verifica si un UID es admin.
 */
export async function isAdmin(uid: string): Promise<boolean> {
  const { adminDb } = await import('./firebase-admin');
  const snap = await adminDb.collection('admins').doc(uid).get();
  return snap.exists;
}

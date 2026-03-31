'use client';

import { auth } from '@/lib/firebase-client';
import type { CartItem, PaymentEntry, Product, Invoice, Client } from '@/types';

// ─────────────────────────────────────────────
// Helper: fetch con auth token
// ─────────────────────────────────────────────
async function authFetch(url: string, options: RequestInit = {}) {
  const user = auth.currentUser;
  if (!user) throw new Error('No autenticado');

  const token = await user.getIdToken();
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
}

// ─────────────────────────────────────────────
// Products (via API route + aggressive client cache)
// ─────────────────────────────────────────────
const productCache: Record<string, { data: Product[]; ts: number }> = {};
const singleCache: Record<string, { data: Product; ts: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 min

export async function fetchProducts(gender?: string): Promise<Product[]> {
  const cacheKey = gender || 'all';

  // Return from cache if fresh
  if (productCache[cacheKey] && Date.now() - productCache[cacheKey].ts < CACHE_TTL) {
    return productCache[cacheKey].data;
  }

  const url = gender ? `/api/products?gender=${gender}` : '/api/products';
  const res = await fetch(url);
  if (!res.ok) throw new Error('Error cargando productos');
  const products: Product[] = await res.json();

  // Cache the list + each individual product
  productCache[cacheKey] = { data: products, ts: Date.now() };
  products.forEach((p) => {
    singleCache[p.id] = { data: p, ts: Date.now() };
  });

  return products;
}

export async function fetchProduct(id: string): Promise<Product> {
  // Instant return if already cached from list fetch
  if (singleCache[id] && Date.now() - singleCache[id].ts < CACHE_TTL) {
    return singleCache[id].data;
  }

  const res = await fetch(`/api/products/${encodeURIComponent(id)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Producto no encontrado');
  }
  const product: Product = await res.json();
  singleCache[id] = { data: product, ts: Date.now() };
  return product;
}

// Pre-fetch both genders on app start (call once from AppShell)
export function prefetchAllProducts() {
  fetchProducts('Hombre').catch(() => { });
  fetchProducts('Mujer').catch(() => { });
}

// ─────────────────────────────────────────────
// Upload proof (client-side con validación)
// ─────────────────────────────────────────────
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic'];
const MAX_SIZE = 5 * 1024 * 1024;

export async function uploadPaymentProof(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error(`Tipo no permitido: ${file.type}. Solo imágenes.`);
  }
  if (file.size > MAX_SIZE) {
    throw new Error(`Archivo muy grande (${(file.size / 1024 / 1024).toFixed(1)}MB). Máx: 5MB.`);
  }

  const { uploadToStorage } = await import('@/lib/firebase-client');
  const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const safeName = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  return uploadToStorage(`payments_proofs/${safeName}`, file);
}

// ─────────────────────────────────────────────
// Create Order (vía API route — server-side validation)
// ─────────────────────────────────────────────
interface CreateOrderParams {
  cart: CartItem[];
  clientData: { name: string; rif_ci: string; phone: string; address: string };
  deliveryType: string;
  deliveryCostUsd: number;
  deliveryZoneInfo: string;
  payments: PaymentEntry[];
  exchangeRate: number;
  proofFile: File | null;
  authenticatedClientId?: string;
}

export async function createOrder(params: CreateOrderParams): Promise<{
  invoiceData: Invoice;
  numericId: number;
  docId: string;
}> {
  let proofUrl: string | null = null;
  if (params.proofFile) {
    proofUrl = await uploadPaymentProof(params.proofFile);
  }

  const res = await authFetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify({
      cart: params.cart.map((item) => ({
        productId: item.productId,
        titulo: item.titulo,
        img: item.img,
        precio: item.precio,
        qty: item.qty,
        size: item.size,
        color: item.color,
        variantIndex: item.variantIndex,
      })),
      clientData: params.clientData,
      deliveryType: params.deliveryType,
      deliveryCostUsd: params.deliveryCostUsd,
      deliveryZoneInfo: params.deliveryZoneInfo,
      payments: params.payments.map((p) => ({
        method: p.method,
        amountUsd: p.amountUsd,
        amountVes: p.amountVes,
        ref: p.ref || '',
      })),
      exchangeRate: params.exchangeRate,
      proofUrl,
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Error al crear la orden');
  }

  return res.json();
}

// ─────────────────────────────────────────────
// Fetch orders (client-side via Firestore — protected by rules)
// ─────────────────────────────────────────────
export async function fetchClientOrders(clientId: string, limitCount = 5): Promise<Invoice[]> {
  const { db, collection, getDocs, query, where, orderBy, limit } = await import('@/lib/firebase-client');
  const q = query(
    collection(db, 'invoices'),
    where('clientId', '==', clientId),
    orderBy('numericId', 'desc'),
    limit(limitCount)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Invoice[];
}

export async function fetchClientOrdersByRif(rif: string, limitCount = 10): Promise<Invoice[]> {
  const { db, collection, getDocs, query, where, limit } = await import('@/lib/firebase-client');
  const q = query(collection(db, 'invoices'), where('clientSnapshot.rif_ci', '==', rif), limit(limitCount));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Invoice[];
}

// ─────────────────────────────────────────────
// Submit rating (vía API route)
// ─────────────────────────────────────────────
export async function submitRating(data: { invoiceId: string; clientId?: string; rating: number; comment: string }) {
  const res = await authFetch('/api/ratings', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al enviar rating');
  }
}

// ─────────────────────────────────────────────
// Client CRUD (via Firestore client — protected by rules)
// ─────────────────────────────────────────────
export async function findClientByRif(rif: string): Promise<Client | null> {
  const { db, collection, getDocs, query, where, limit } = await import('@/lib/firebase-client');
  const q = query(collection(db, 'clients'), where('rif_ci', '==', rif), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const docSnap = snap.docs[0];
  return { id: docSnap.id, ...docSnap.data() } as Client;
}

export async function saveClient(
  data: Omit<Client, 'id'>,
  existingId?: string
): Promise<Client> {
  const { db, doc, setDoc } = await import('@/lib/firebase-client');
  const { collection, addDoc, updateDoc } = await import('firebase/firestore');

  if (existingId) {
    await updateDoc(doc(db, 'clients', existingId), data as any);
    return { id: existingId, ...data };
  }

  const ref = await addDoc(collection(db, 'clients'), data);
  return { id: ref.id, ...data };
}
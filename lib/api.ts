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
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes (stale-while-revalidate, so TTL can be longer)

async function loadProducts(gender: string | undefined, cacheKey: string): Promise<Product[]> {
  const url = gender ? `/api/products?gender=${gender}` : '/api/products';
  // Retry until 2 attempts (handles Netlify cold-start timeouts)
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Error cargando productos');
      const products: Product[] = await res.json();
      productCache[cacheKey] = { data: products, ts: Date.now() };
      products.forEach((p) => { singleCache[p.id] = { data: p, ts: Date.now() }; });
      return products;
    } catch (err) {
      if (attempt === 1) throw err;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw new Error('unreachable');
}

export async function fetchProducts(gender?: string): Promise<Product[]> {
  const cacheKey = gender || 'all';
  const cached = productCache[cacheKey];
  const isFresh = cached && Date.now() - cached.ts < CACHE_TTL;

  if (isFresh) return cached.data;

  // Stale-while-revalidate: si hay datos aunque sean viejos, devolverlos
  // inmediatamente y refrescar en background. Esto evita que un cold
  // start de Netlify deje el menú vacío mientras el usuario ya tiene
  // datos en pantalla.
  if (cached) {
    loadProducts(gender, cacheKey).catch(() => {});
    return cached.data;
  }

  // Primera carga: esperar la respuesta (con reintentos)
  return loadProducts(gender, cacheKey);
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

// Seed a single product into cache (instant detail page load)
export function seedProduct(product: Product) {
  singleCache[product.id] = { data: product, ts: Date.now() };
}

// Seed a full product list into cache (server-rendered initial data).
// Hace que el primer fetchProducts(gender) de la home devuelva al
// instante, sin esperar al round-trip a Netlify.
export function seedProducts(gender: string | undefined, products: Product[]) {
  const cacheKey = gender || 'all';
  productCache[cacheKey] = { data: products, ts: Date.now() };
  products.forEach((p) => { singleCache[p.id] = { data: p, ts: Date.now() }; });
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
  couponCode?: string;
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
      couponCode: params.couponCode || null,
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
export async function fetchClientOrders(clientId: string, limitCount = 20): Promise<Invoice[]> {
  const { db, collection, getDocs, query, where, limit } = await import('@/lib/firebase-client');
  const q = query(
    collection(db, 'invoices'),
    where('clientId', '==', clientId),
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
export async function submitRating(data: { invoiceId: string; clientId?: string; numericId?: number; rating: number; comment: string }) {
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
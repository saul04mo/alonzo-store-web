import { NextRequest, NextResponse } from 'next/server';
import { adminDb, Timestamp } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth';

// ─────────────────────────────────────────────
// POST /api/coupons/validate
// Validates a coupon code server-side and returns discount info.
// ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // 1. Auth
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // 2. Parse body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const { code, subtotal } = body;
  if (!code || typeof code !== 'string') {
    return NextResponse.json({ error: 'Código requerido.' }, { status: 400 });
  }
  if (typeof subtotal !== 'number' || subtotal < 0) {
    return NextResponse.json({ error: 'Subtotal inválido.' }, { status: 400 });
  }

  // 3. Find coupon in Firestore
  const upperCode = code.toUpperCase().trim();
  const snap = await adminDb.collection('coupons').where('code', '==', upperCode).limit(1).get();

  if (snap.empty) {
    return NextResponse.json({ error: 'Cupón no encontrado.' }, { status: 404 });
  }

  const doc = snap.docs[0];
  const coupon = { id: doc.id, ...doc.data() } as any;

  // 4. Validate
  if (!coupon.active) {
    return NextResponse.json({ error: 'Este cupón está desactivado.' }, { status: 400 });
  }

  const now = Date.now();
  if (coupon.startsAt && coupon.startsAt.toMillis() > now) {
    return NextResponse.json({ error: 'Este cupón aún no está vigente.' }, { status: 400 });
  }
  if (coupon.expiresAt && coupon.expiresAt.toMillis() < now) {
    return NextResponse.json({ error: 'Este cupón ha expirado.' }, { status: 400 });
  }

  if (coupon.maxUsesTotal > 0 && (coupon.usedCount || 0) >= coupon.maxUsesTotal) {
    return NextResponse.json({ error: 'Este cupón ha alcanzado su límite de usos.' }, { status: 400 });
  }

  if (coupon.maxUsesPerClient > 0) {
    const clientUses = coupon.usageByClient?.[user.uid] || 0;
    if (clientUses >= coupon.maxUsesPerClient) {
      return NextResponse.json({ error: 'Ya alcanzaste el límite de usos de este cupón.' }, { status: 400 });
    }
  }

  if (coupon.minPurchase > 0 && subtotal < coupon.minPurchase) {
    return NextResponse.json({
      error: `Compra mínima de $${coupon.minPurchase.toFixed(2)} requerida. Tu subtotal es $${subtotal.toFixed(2)}.`,
    }, { status: 400 });
  }

  // 5. Calculate discount
  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = (subtotal * coupon.discountValue) / 100;
  } else {
    discountAmount = Math.min(coupon.discountValue, subtotal);
  }
  discountAmount = Math.round(discountAmount * 100) / 100;

  const desc = coupon.discountType === 'percentage'
    ? `${coupon.discountValue}% de descuento`
    : `$${coupon.discountValue.toFixed(2)} de descuento`;

  return NextResponse.json({
    coupon: {
      couponId: coupon.id,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      description: desc,
      freeShipping: coupon.freeShipping || false,
    },
  });
}

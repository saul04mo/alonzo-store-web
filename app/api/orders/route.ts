import { NextRequest, NextResponse } from 'next/server';
import { adminDb, FieldValue, Timestamp } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth';

// ─────────────────────────────────────────────
// Rate limiting (in-memory, se resetea al redeploy)
// ─────────────────────────────────────────────
const orderTimestamps = new Map<string, number[]>();
const RATE_WINDOW = 60_000;
const MAX_PER_WINDOW = 3;

function isRateLimited(uid: string): boolean {
  const now = Date.now();
  const times = (orderTimestamps.get(uid) || []).filter((t) => now - t < RATE_WINDOW);
  if (times.length >= MAX_PER_WINDOW) return true;
  times.push(now);
  orderTimestamps.set(uid, times);
  return false;
}

// ─────────────────────────────────────────────
// POST /api/orders — Crear orden
// ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // 1. Verificar autenticación
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // 2. Rate limiting
  if (isRateLimited(user.uid)) {
    return NextResponse.json(
      { error: 'Demasiadas órdenes. Espera un momento.' },
      { status: 429 }
    );
  }

  // 3. Parsear body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 });
  }

  const { cart, clientData, deliveryType, deliveryCostUsd, deliveryZoneInfo, payments, exchangeRate, proofUrl, couponCode } = body;

  // 4. Validar inputs
  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    return NextResponse.json({ error: 'Carrito vacío' }, { status: 400 });
  }
  if (cart.length > 50) {
    return NextResponse.json({ error: 'Máximo 50 items' }, { status: 400 });
  }
  if (!clientData?.name || !clientData?.rif_ci) {
    return NextResponse.json({ error: 'Faltan datos del cliente' }, { status: 400 });
  }
  if (!['pickup', 'delivery', 'nacional'].includes(deliveryType)) {
    return NextResponse.json({ error: 'Tipo de envío inválido' }, { status: 400 });
  }
  if (typeof deliveryCostUsd !== 'number' || deliveryCostUsd < 0 || deliveryCostUsd > 100) {
    return NextResponse.json({ error: 'Costo de envío inválido' }, { status: 400 });
  }

  // 5. TRANSACCIÓN ATÓMICA
  try {
    const result = await adminDb.runTransaction(async (transaction) => {
      // 5a. Leer productos y VALIDAR PRECIOS
      const productReads: Record<string, { ref: FirebaseFirestore.DocumentReference; data: any }> = {};
      for (const item of cart) {
        if (!item.productId) throw new Error(`Item sin productId: ${item.titulo}`);
        if (!productReads[item.productId]) {
          const ref = adminDb.collection('products').doc(item.productId);
          const snap = await transaction.get(ref);
          if (!snap.exists) throw new Error(`Producto no encontrado: ${item.productId}`);
          productReads[item.productId] = { ref, data: snap.data() };
        }
      }

      // 5b. Validar precio y stock
      let serverSubtotal = 0;
      const stockUpdates: Record<string, any[]> = {};

      for (const item of cart) {
        const product = productReads[item.productId];
        const variants = product.data.variants || [];

        if (item.variantIndex < 0 || item.variantIndex >= variants.length) {
          throw new Error(`Variante inválida para ${item.titulo}`);
        }

        const variant = variants[item.variantIndex];
        const serverPrice = parseFloat(variant.price);
        const clientPrice = parseFloat(item.precio);

        if (Math.abs(serverPrice - clientPrice) > 0.01) {
          throw new Error(`Precio manipulado: ${item.titulo}. Real: $${serverPrice}, recibido: $${clientPrice}`);
        }

        const stock = parseInt(variant.stock) || 0;
        if (item.qty > stock) {
          throw new Error(`Stock insuficiente: ${item.titulo} (${variant.size}). Disponible: ${stock}`);
        }
        if (item.qty <= 0 || item.qty > 99) {
          throw new Error(`Cantidad inválida: ${item.qty}`);
        }

        serverSubtotal += serverPrice * item.qty;

        if (!stockUpdates[item.productId]) {
          stockUpdates[item.productId] = JSON.parse(JSON.stringify(variants));
        }
        stockUpdates[item.productId][item.variantIndex].stock =
          parseInt(stockUpdates[item.productId][item.variantIndex].stock) - item.qty;
      }

      // 5b-bis. Calculate product offer discounts
      let offerDiscount = 0;
      for (const item of cart) {
        const product = productReads[item.productId];
        const offer = product.data.offer;
        if (offer && offer.value > 0) {
          const variant = product.data.variants[item.variantIndex];
          const basePrice = parseFloat(variant.price);
          const lineTotal = basePrice * item.qty;
          if (offer.type === 'percentage') {
            offerDiscount += (lineTotal * offer.value) / 100;
          } else {
            offerDiscount += Math.min(offer.value * item.qty, lineTotal);
          }
        }
      }
      offerDiscount = Math.round(offerDiscount * 100) / 100;

      const serverTotal = serverSubtotal - offerDiscount + deliveryCostUsd;

      // 5c-bis. Validate coupon server-side (if provided)
      let couponDiscount = 0;
      let appliedCouponData: any = null;

      if (couponCode && typeof couponCode === 'string') {
        const couponSnap = await adminDb.collection('coupons').where('code', '==', couponCode.toUpperCase().trim()).limit(1).get();

        if (!couponSnap.empty) {
          const couponDoc = couponSnap.docs[0];
          const coupon = couponDoc.data();
          const now = Date.now();
          const isActive = coupon.active;
          const inDateRange =
            (!coupon.startsAt || coupon.startsAt.toMillis() <= now) &&
            (!coupon.expiresAt || coupon.expiresAt.toMillis() >= now);
          const notExhausted = !coupon.maxUsesTotal || (coupon.usedCount || 0) < coupon.maxUsesTotal;
          const clientNotExhausted = !coupon.maxUsesPerClient ||
            ((coupon.usageByClient?.[user!.uid] || 0) < coupon.maxUsesPerClient);
          const meetsMinPurchase = !coupon.minPurchase || serverSubtotal >= coupon.minPurchase;

          if (isActive && inDateRange && notExhausted && clientNotExhausted && meetsMinPurchase) {
            if (coupon.discountType === 'percentage') {
              couponDiscount = (serverSubtotal * coupon.discountValue) / 100;
            } else {
              couponDiscount = Math.min(coupon.discountValue, serverSubtotal);
            }
            couponDiscount = Math.round(couponDiscount * 100) / 100;

            appliedCouponData = {
              couponId: couponDoc.id,
              code: coupon.code,
              discountAmount: couponDiscount,
              description: coupon.discountType === 'percentage'
                ? `${coupon.discountValue}% OFF`
                : `$${coupon.discountValue.toFixed(2)} OFF`,
              freeShipping: coupon.freeShipping || false,
            };

            // Increment coupon usage
            const couponRef = adminDb.collection('coupons').doc(couponDoc.id);
            transaction.update(couponRef, {
              usedCount: FieldValue.increment(1),
              [`usageByClient.${user!.uid}`]: FieldValue.increment(1),
            });
          }
        }
      }

      const effectiveDeliveryCost = appliedCouponData?.freeShipping ? 0 : deliveryCostUsd;
      const serverTotalAfterCoupon = Math.max(0, serverSubtotal - offerDiscount - couponDiscount + effectiveDeliveryCost);

      // 5c. Atomic numericId
      const counterRef = adminDb.collection('config').doc('orderCounter');
      const counterSnap = await transaction.get(counterRef);
      let newNumericId: number;

      if (counterSnap.exists) {
        newNumericId = (counterSnap.data()?.current || 0) + 1;
      } else {
        const lastQ = adminDb.collection('invoices').orderBy('numericId', 'desc').limit(1);
        const lastSnap = await transaction.get(lastQ);
        newNumericId = (lastSnap.empty ? 0 : lastSnap.docs[0].data().numericId) + 1;
      }

      transaction.set(counterRef, { current: newNumericId }, { merge: true });

      // 5d. Actualizar stock
      for (const [pid, variants] of Object.entries(stockUpdates)) {
        transaction.update(productReads[pid].ref, { variants });
      }

      // 5e. Upsert client
      const clientRef = adminDb.collection('clients').doc(user.uid);
      transaction.set(clientRef, {
        name: clientData.name,
        rif_ci: clientData.rif_ci,
        phone: clientData.phone || '',
        address: clientData.address || '',
        email: user.email || '',
      }, { merge: true });

      // 5f. Build invoice
      const finalPayments = (payments || []).map((p: any) => ({
        ...p,
        ...(proofUrl ? { proofUrl } : {}),
      }));

      const paidVes = finalPayments.reduce((a: number, p: any) => a + (p.amountVes || 0), 0);
      const totalVes = serverTotalAfterCoupon * (exchangeRate || 1);
      const changeVes = Math.max(0, parseFloat((paidVes - totalVes).toFixed(2)));

      const invoiceData = {
        numericId: newNumericId,
        clientId: user.uid,
        clientSnapshot: {
          name: clientData.name,
          rif_ci: clientData.rif_ci,
          phone: clientData.phone || '',
          address: clientData.address || '',
          email: user.email || '',
        },
        date: Timestamp.now(),
        items: cart.map((item: any) => {
          const variant = productReads[item.productId]?.data?.variants?.[item.variantIndex];
          const serverPrice = variant ? parseFloat(variant.price) : parseFloat(item.precio);
          const serverSize = variant?.size || item.size || '';
          const serverColor = variant?.color || item.color || '';
          // Build label matching POS format: "S" or "S / Azul" (skip color if empty)
          const variantLabel = serverColor
            ? `${serverSize} / ${serverColor}`
            : serverSize || 'N/A';
          return {
            // ── Standard fields (same as POS) ──
            productId: item.productId,
            productName: item.titulo,
            priceAtSale: serverPrice,
            quantity: item.qty,
            variantIndex: item.variantIndex,
            variantLabel,
            discount: { type: 'none', value: 0 },
            // ── Legacy fields (backward compat) ──
            titulo: item.titulo,
            name: item.titulo,
            price: serverPrice,
            rowTotal: serverPrice * item.qty,
            qty: item.qty,
            size: serverSize,
            color: serverColor,
            img: item.img || '',
          };
        }),
        totalDiscount: (offerDiscount + couponDiscount) > 0
          ? { type: couponDiscount > 0 ? 'coupon' : 'offer', value: offerDiscount + couponDiscount }
          : { type: 'none', value: 0 },
        offerDiscount: offerDiscount,
        total: serverTotalAfterCoupon,
        exchangeRate: exchangeRate || 1,
        payments: finalPayments,
        status: 'Creada',
        abonos: [],
        changeGiven: changeVes,
        sellerName: 'WEB APP',
        sellerUid: 'WEB',
        deliveryType,
        deliveryCostUsd: effectiveDeliveryCost,
        deliveryZone: deliveryZoneInfo || '',
        deliveryPaidInStore: deliveryType === 'delivery',
        observation: 'Venta Online',
        appliedCoupon: appliedCouponData || null,
        appliedPromotions: [],
      };

      const invoiceRef = adminDb.collection('invoices').doc();
      transaction.set(invoiceRef, invoiceData);

      return { invoiceData: { ...invoiceData, id: invoiceRef.id }, numericId: newNumericId, docId: invoiceRef.id };
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error('[createOrder] Error:', err.message);
    return NextResponse.json({ error: err.message || 'Error al crear la orden' }, { status: 400 });
  }
}

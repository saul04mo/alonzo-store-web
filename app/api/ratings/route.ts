import { NextRequest, NextResponse } from 'next/server';
import { adminDb, Timestamp } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const body = await request.json();
  const { invoiceId, rating, comment } = body;

  if (!invoiceId || typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
  }
  if (comment && comment.length > 1000) {
    return NextResponse.json({ error: 'Comentario muy largo' }, { status: 400 });
  }

  try {
    await adminDb.collection('order_ratings').add({
      invoiceId,
      clientId: user.uid,
      rating,
      comment: comment || '',
      createdAt: Timestamp.now(),
      platform: 'Web App',
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

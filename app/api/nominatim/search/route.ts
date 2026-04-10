import { NextRequest, NextResponse } from 'next/server';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q');
  const limit = searchParams.get('limit') || '5';
  const countrycodes = searchParams.get('countrycodes') || 've';
  const format = searchParams.get('format') || 'json';

  if (!q || q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const url = `${NOMINATIM_URL}?format=${format}&q=${encodeURIComponent(q)}&limit=${limit}&countrycodes=${countrycodes}&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ALONZO-Store/1.0 (contact@alonzo.com)',
        'Accept-Language': 'es',
      },
    });

    if (!res.ok) {
      console.error(`Nominatim search failed: ${res.status}`);
      return NextResponse.json([], { status: 200 });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('Nominatim search error:', err.message);
    return NextResponse.json([], { status: 200 });
  }
}

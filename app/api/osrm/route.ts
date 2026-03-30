import { NextRequest, NextResponse } from 'next/server';

const ORS_API_KEY = process.env.ORS_API_KEY || '';
const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || '';
const TIMEOUT_MS = 5000;

async function fetchWithTimeout(url: string, timeoutMs: number, headers?: Record<string, string>): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, { signal: controller.signal, headers });
    } finally {
        clearTimeout(timer);
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const lat1 = searchParams.get('lat1');
    const lng1 = searchParams.get('lng1');
    const lat2 = searchParams.get('lat2');
    const lng2 = searchParams.get('lng2');

    if (!lat1 || !lng1 || !lat2 || !lng2) {
        return NextResponse.json({ error: 'lat1, lng1, lat2, lng2 are required' }, { status: 400 });
    }

    // ── 1) OpenRouteService (2,000 req/day free) ──
    if (ORS_API_KEY) {
        try {
            const url = `https://api.openrouteservice.org/v2/directions/driving-car?start=${lng1},${lat1}&end=${lng2},${lat2}`;
            const res = await fetchWithTimeout(url, TIMEOUT_MS, {
                'Authorization': ORS_API_KEY,
                'Accept': 'application/json, application/geo+json',
            });
            if (res.ok) {
                const data = await res.json();
                const seg = data.features?.[0]?.properties?.segments?.[0];
                const coords = data.features?.[0]?.geometry?.coordinates;
                if (seg) {
                    return NextResponse.json({
                        code: 'Ok',
                        routes: [{
                            distance: seg.distance,
                            duration: seg.duration,
                            geometry: { coordinates: coords },
                        }],
                    });
                }
            }
            console.warn('ORS:', res.status);
        } catch (e: any) {
            console.warn('ORS failed:', e?.name === 'AbortError' ? 'timeout' : e?.message);
        }
    }

    // ── 2) Mapbox fallback (100,000 req/month free) ──
    if (MAPBOX_TOKEN) {
        try {
            const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${lng1},${lat1};${lng2},${lat2}?geometries=geojson&overview=full&access_token=${MAPBOX_TOKEN}`;
            const res = await fetchWithTimeout(url, TIMEOUT_MS);
            if (res.ok) {
                const data = await res.json();
                if (data.code === 'Ok' && data.routes?.[0]) {
                    return NextResponse.json(data);
                }
            }
            console.warn('Mapbox:', res.status);
        } catch (e: any) {
            console.warn('Mapbox failed:', e?.name === 'AbortError' ? 'timeout' : e?.message);
        }
    }

    return NextResponse.json(
        { code: 'Error', message: 'All routing servers unavailable' },
        { status: 503 }
    );
}
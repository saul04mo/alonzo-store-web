import { NextRequest, NextResponse } from 'next/server';

// Multiple OSRM servers to try in order
const OSRM_SERVERS = [
    'https://router.project-osrm.org',
    'https://routing.openstreetmap.de/routed-car',
];

const TIMEOUT_MS = 5000; // 5 seconds max per server

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: controller.signal });
        return res;
    } finally {
        clearTimeout(timer);
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const coords = searchParams.get('coords'); // "lng1,lat1;lng2,lat2"
    const overview = searchParams.get('overview') || 'full';
    const geometries = searchParams.get('geometries') || 'geojson';

    if (!coords) {
        return NextResponse.json({ error: 'coords param required (lng1,lat1;lng2,lat2)' }, { status: 400 });
    }

    for (const server of OSRM_SERVERS) {
        try {
            const url = `${server}/route/v1/driving/${coords}?overview=${overview}&geometries=${geometries}`;
            const res = await fetchWithTimeout(url, TIMEOUT_MS);

            if (!res.ok) {
                console.warn(`OSRM server ${server} returned ${res.status}`);
                continue;
            }

            const data = await res.json();
            if (data.code === 'Ok') {
                return NextResponse.json(data);
            }

            console.warn(`OSRM server ${server} returned code: ${data.code}`);
        } catch (error: any) {
            const reason = error?.name === 'AbortError' ? 'timeout' : error?.message;
            console.warn(`OSRM server ${server} failed: ${reason}`);
        }
    }

    // All servers failed — return a specific code so the client can use Haversine fallback
    return NextResponse.json(
        { code: 'Error', message: 'All OSRM servers unavailable' },
        { status: 503 }
    );
}
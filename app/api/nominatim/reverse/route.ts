import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');
    const format = searchParams.get('format') || 'json';

    if (!lat || !lon) {
        return NextResponse.json({ error: 'lat and lon are required' }, { status: 400 });
    }

    try {
        const url = new URL('https://nominatim.openstreetmap.org/reverse');
        url.searchParams.set('format', format);
        url.searchParams.set('lat', lat);
        url.searchParams.set('lon', lon);

        const res = await fetch(url.toString(), {
            headers: {
                'User-Agent': 'AlonzoStore/1.0 (https://alonzo-store-web.netlify.app)',
                'Accept-Language': 'es',
            },
        });

        if (!res.ok) {
            return NextResponse.json({ error: 'Nominatim error' }, { status: res.status });
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Nominatim reverse error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import type { ShippingOfficesResponse, ShippingAgencyOffices } from '@/types';

// Las oficinas casi nunca cambian → caché largo en memoria (1 día).
let cache: { data: ShippingOfficesResponse; ts: number } | null = null;
const TTL = 24 * 60 * 60 * 1000;

/**
 * Devuelve las oficinas de envío nacional agrupadas para los dropdowns en
 * cascada del checkout: agencia → estado → ciudad → oficina.
 * Solo incluye oficinas con active === true.
 */
export async function GET() {
  if (cache && Date.now() - cache.ts < TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    const snap = await adminDb
      .collection('shipping_offices')
      .where('active', '==', true)
      .get();

    // agency -> state -> city -> offices[]
    const tree = new Map<string, Map<string, Map<string, { name: string; address: string; phone: string }[]>>>();

    snap.forEach((doc) => {
      const d = doc.data();
      const agency = d.agency as string;
      const state = d.state as string;
      const city = d.city as string;
      if (!agency || !state || !city || !d.name) return;

      if (!tree.has(agency)) tree.set(agency, new Map());
      const states = tree.get(agency)!;
      if (!states.has(state)) states.set(state, new Map());
      const cities = states.get(state)!;
      if (!cities.has(city)) cities.set(city, []);
      cities.get(city)!.push({
        name: d.name,
        address: d.address || '',
        phone: d.phone || '',
      });
    });

    const byName = (a: string, b: string) => a.localeCompare(b, 'es');
    const agencies: ShippingAgencyOffices[] = [...tree.entries()]
      .map(([agency, states]) => ({
        agency,
        states: [...states.entries()]
          .map(([state, cities]) => ({
            state,
            cities: [...cities.entries()]
              .map(([city, offices]) => ({
                city,
                offices: offices.sort((a, b) => byName(a.name, b.name)),
              }))
              .sort((a, b) => byName(a.city, b.city)),
          }))
          .sort((a, b) => byName(a.state, b.state)),
      }))
      .sort((a, b) => byName(a.agency, b.agency));

    const data: ShippingOfficesResponse = { agencies };
    cache = { data, ts: Date.now() };
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[shipping-offices] Error:', err.message);
    return NextResponse.json({ agencies: [] }, { status: 200 });
  }
}

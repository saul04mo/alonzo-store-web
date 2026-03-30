'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import type L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Search, X } from 'lucide-react';

/* ── Store location (Caracas – adjust coordinates as needed) ── */
const STORE_LAT = 10.4961;
const STORE_LNG = -66.8815;

/* ── Delivery pricing by ROAD distance (km por carretera, no línea recta) ── */
const DELIVERY_TIERS = [
  { maxKm: 8, price: 3.0, label: 'Zona cercana' },
  { maxKm: 15, price: 4.0, label: 'Zona intermedia' },
  { maxKm: 25, price: 5.0, label: 'Zona lejana' },
  { maxKm: Infinity, price: 8.0, label: 'Zona extendida' },
];

/* ── Haversine formula (FALLBACK si OSRM falla) ── */
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ── OSRM: distancia REAL por carretera (gratis, sin API key) ── */
async function getRoadDistanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): Promise<{ km: number; durationMin: number; isRoad: boolean; routeCoords: [number, number][] | null }> {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${lng1},${lat1};${lng2},${lat2}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.code === 'Ok' && data.routes?.[0]) {
      const route = data.routes[0];
      // GeoJSON coords son [lng, lat] → convertir a [lat, lng] para Leaflet
      const routeCoords: [number, number][] = route.geometry?.coordinates?.map(
        (c: [number, number]) => [c[1], c[0]] as [number, number]
      ) || null;
      return {
        km: route.distance / 1000,
        durationMin: Math.round(route.duration / 60),
        isRoad: true,
        routeCoords,
      };
    }
  } catch (err) {
    console.warn('OSRM falló, usando Haversine como fallback:', err);
  }

  return {
    km: haversineKm(lat1, lng1, lat2, lng2),
    durationMin: 0,
    isRoad: false,
    routeCoords: null,
  };
}

function getDeliveryTier(km: number) {
  return DELIVERY_TIERS.find((t) => km <= t.maxKm) || DELIVERY_TIERS[DELIVERY_TIERS.length - 1];
}

/* ── Nominatim search ── */
interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

async function searchAddress(query: string): Promise<NominatimResult[]> {
  if (query.length < 3) return [];
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=ve&addressdetails=1`;
  const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
  return res.json();
}

/* ── Types ── */
export interface AddressResult {
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  deliveryCost: number;
  deliveryLabel: string;
}

interface AddressPickerProps {
  initialAddress?: string;
  onAddressSelect: (result: AddressResult) => void;
  showCostPricing?: boolean;
}

/* ── Component ── */
export function AddressPicker({ initialAddress, onAddressSelect, showCostPricing = true }: AddressPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const leafletRef = useRef<typeof L | null>(null);

  const [query, setQuery] = useState(initialAddress || '');
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [distanceInfo, setDistanceInfo] = useState<{
    km: number;
    cost: number;
    label: string;
    durationMin: number;
    isRoad: boolean;
  } | null>(null);
  const [showResults, setShowResults] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    let cancelled = false;

    (async () => {
      const leaflet = await import('leaflet');
      if (cancelled) return;

      leafletRef.current = leaflet.default || leaflet;
      const Leaf = leafletRef.current;

      // Fix default marker icons
      // @ts-ignore
      delete Leaf.Icon.Default.prototype._getIconUrl;
      Leaf.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = Leaf.map(mapRef.current!, {
        center: [STORE_LAT, STORE_LNG],
        zoom: 13,
        zoomControl: true,
        attributionControl: true,
      });

      Leaf.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const storeIcon = Leaf.divIcon({
        html: `<div style="width:32px;height:32px;background:black;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🏪</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        className: '',
      });
      Leaf.marker([STORE_LAT, STORE_LNG], { icon: storeIcon })
        .addTo(map)
        .bindPopup('Alonzo Store');

      mapInstance.current = map;

      map.on('click', (e: any) => {
        placeMarker(e.latlng.lat, e.latlng.lng, 'Ubicación seleccionada en el mapa');
        reverseGeocode(e.latlng.lat, e.latlng.lng);
      });
    })();

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`
      );
      const data = await res.json();
      if (data.display_name) {
        setQuery(data.display_name);
        setSelectedAddress(data.display_name);
        
        // Distancia real por carretera
        const road = await getRoadDistanceKm(STORE_LAT, STORE_LNG, lat, lng);
        const km = Math.round(road.km * 10) / 10;
        const tier = getDeliveryTier(km);
        drawRoute(road.routeCoords);
        onAddressSelect({
          address: data.display_name,
          lat,
          lng,
          distanceKm: km,
          deliveryCost: tier.price,
          deliveryLabel: tier.label,
        });
      }
    } catch {}
  };

  /* ── Dibujar ruta en el mapa ── */
  const drawRoute = (coords: [number, number][] | null) => {
    if (!mapInstance.current || !leafletRef.current) return;
    // Limpiar ruta anterior
    if (routeLayerRef.current) {
      mapInstance.current.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }
    if (!coords || coords.length === 0) return;
    const Leaf = leafletRef.current;
    routeLayerRef.current = Leaf.polyline(coords, {
      color: '#0a0a0a',
      weight: 4,
      opacity: 0.7,
      dashArray: '8, 6',
    }).addTo(mapInstance.current);
    // Zoom para ver la ruta completa
    mapInstance.current.fitBounds(routeLayerRef.current.getBounds(), { padding: [40, 40], maxZoom: 15 });
  };

  const placeMarker = useCallback(async (lat: number, lng: number, label: string) => {
    if (!mapInstance.current || !leafletRef.current) return;
    const Leaf = leafletRef.current;

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng]);
    } else {
      markerRef.current = Leaf.marker([lat, lng]).addTo(mapInstance.current);
    }
    markerRef.current.bindPopup(label).openPopup();

    mapInstance.current.flyTo([lat, lng], 15, { duration: 1 });

    // Mostrar "Calculando..." mientras OSRM responde
    setDistanceInfo({ km: 0, cost: 0, label: 'Calculando ruta...', durationMin: 0, isRoad: false });

    const road = await getRoadDistanceKm(STORE_LAT, STORE_LNG, lat, lng);
    const km = Math.round(road.km * 10) / 10;
    const tier = getDeliveryTier(km);

    // Dibujar ruta en el mapa
    drawRoute(road.routeCoords);

    setDistanceInfo({
      km,
      cost: tier.price,
      label: tier.label,
      durationMin: road.durationMin,
      isRoad: road.isRoad,
    });

    setSelectedAddress(label);
    onAddressSelect({
      address: label,
      lat,
      lng,
      distanceKm: km,
      deliveryCost: tier.price,
      deliveryLabel: tier.label,
    });
  }, [onAddressSelect]);

  // Debounced search
  const handleInputChange = (value: string) => {
    setQuery(value);
    setShowResults(true);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(async () => {
      if (value.length < 3) { setResults([]); return; }
      setSearching(true);
      const r = await searchAddress(value);
      setResults(r);
      setSearching(false);
    }, 400);
  };

  const handleSelect = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setQuery(result.display_name);
    setShowResults(false);
    setResults([]);
    placeMarker(lat, lng, result.display_name);
  };

  // Use GPS
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        placeMarker(latitude, longitude, 'Mi ubicación');
        reverseGeocode(latitude, longitude);
      },
      () => alert('No se pudo obtener tu ubicación.'),
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="space-y-4">
      {/* Search input */}
      <div className="relative">
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            className="w-full border border-gray-200 rounded-lg pl-11 pr-10 py-3.5 text-base outline-none transition-all focus:border-black focus:ring-1 focus:ring-black/5 placeholder:text-gray-400 bg-white"
            placeholder="Busca tu dirección..."
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => results.length > 0 && setShowResults(true)}
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setResults([]); setShowResults(false); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Results dropdown */}
        {showResults && results.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-[200px] overflow-y-auto">
            {results.map((r, i) => (
              <button
                key={i}
                onClick={() => handleSelect(r)}
                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 flex items-start gap-3"
              >
                <MapPin size={14} className="text-gray-400 mt-0.5 shrink-0" />
                <span className="line-clamp-2">{r.display_name}</span>
              </button>
            ))}
          </div>
        )}

        {searching && (
          <div className="absolute z-50 top-full left-0 right-0 bg-white border border-gray-200 rounded-lg mt-1 shadow-lg px-4 py-3 text-sm text-gray-500">
            Buscando...
          </div>
        )}
      </div>

      {/* GPS Button */}
      <button
        type="button"
        onClick={handleUseMyLocation}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors font-medium"
      >
        <Navigation size={14} />
        Usar mi ubicación actual
      </button>

      {/* Map */}
      <div
        ref={mapRef}
        className="w-full h-[280px] rounded-lg border border-gray-200 overflow-hidden"
        style={{ zIndex: 1 }}
      />

      {/* Distance info */}
      {distanceInfo && (
        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-black text-white flex items-center justify-center">
              <MapPin size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {distanceInfo.label} — {distanceInfo.km} km
              </p>
              <p className="text-xs text-gray-500">
                {distanceInfo.isRoad && distanceInfo.durationMin > 0
                  ? `~${distanceInfo.durationMin} min por carretera`
                  : distanceInfo.km === 0
                    ? 'Calculando ruta...'
                    : 'Distancia desde la tienda'}
              </p>
            </div>
          </div>
          {showCostPricing && distanceInfo.cost > 0 && (
            <div className="text-right">
              <p className="text-lg font-bold text-gray-900">${distanceInfo.cost.toFixed(2)}</p>
              <p className="text-xs text-gray-500">Costo de envío</p>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400">
        Puedes buscar tu dirección, usar tu GPS, o hacer clic en el mapa para marcar tu ubicación.
      </p>
    </div>
  );
}

import type { DeliveryZoneGroup, DeliveryMethod } from '@/types';

export const deliveryZones: DeliveryZoneGroup[] = [
  {
    price: 3.0,
    zones: [
      '1040 - San Juan, El Silencio, Los Próceres',
      '1050 - Plaza Vzla, Sabana Grande, La Florida',
      '1060 - Chacao, Altamira, Las Mercedes',
      '1010 - La Candelaria, Capitolio, Bellas Artes',
    ],
  },
  {
    price: 4.0,
    zones: [
      '1020 - El Paraíso, Montalbán, La Vega',
      '1030 - Catia, 23 de Enero',
      '1061 - El Cafetal, Santa Paula',
      '1071 - Los Ruices, La Urbina, Macaracuay',
      '1073 - Petare, La California',
      '1041 - La Yaguara',
      '1090 - El Valle, Coche, San Bernardino',
      '1091 - Lomas de las Mercedes',
    ],
  },
  {
    price: 5.0,
    zones: [
      '1081 - La Trinidad, El Placer',
      '1080 - Baruta, Prados del Este, Manzanares',
      '1083 - El Hatillo, La Lagunita',
      '1000 - Caricuao',
    ],
  },
];

export const deliveryMethods: DeliveryMethod[] = [
  { id: 'pickup', label: 'Retiro en Tienda', desc: 'Gratis' },
  { id: 'delivery', label: 'Delivery', desc: 'Cálculo por mapa' }, // Also updating desc to match map behavior
  { id: 'nacional', label: 'Envío Nacional', desc: 'Cobro a destino' },
];

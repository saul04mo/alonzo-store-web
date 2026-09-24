import type { PaymentMethod } from '@/types';

export const paymentOptions: PaymentMethod[] = [
  {
    id: 'pago_movil',
    name: 'Pago Móvil',
    currency: 'ves',
    icon: 'Smartphone',
    accountInfo: {
      bank: 'BANESCO',
      name: 'ALONZO C.A',
      ci: 'J506071266',
      phone: '04242487297',
    },
  },
  {
    id: 'efectivo_usd',
    name: 'Efectivo ($)',
    currency: 'usd',
    icon: 'Banknote',
    accountInfo: {},
  },
  {
    id: 'binance',
    name: 'Binance',
    currency: 'usd',
    icon: 'Bitcoin',
    accountInfo: {
      email: 'alonzoadm@outlook.com',
      user: 'maichanx',
    },
  },
];

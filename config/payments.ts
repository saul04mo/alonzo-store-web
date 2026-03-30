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
    id: 'zelle',
    name: 'Zelle',
    currency: 'usd',
    icon: 'Building2',
    accountInfo: {
      name: 'YACKSON MONTERO',
      email: 'yamdlr@gmail.com',
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
  {
    id: 'zinli',
    name: 'Zinli',
    currency: 'usd',
    icon: 'Wallet',
    accountInfo: {
      email: 'maykalonzzo@gmail.com',
      user: 'Maikel Alonzo',
    },
  },
  {
    id: 'paypal',
    name: 'PayPal',
    currency: 'usd',
    icon: 'CreditCard',
    accountInfo: {
      email: 'maikel-alonzo@hotmail.com',
      user: 'Maikel Alonzo',
    },
  },
];

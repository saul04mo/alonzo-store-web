// ============================================
// DOMAIN TYPES — Alonzo Store
// ============================================

export interface ProductVariant {
  size: string;
  color: string;
  price: string;
  stock: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  gender: 'Hombre' | 'Mujer';
  imageUrl: string;
  price?: string;
  variants: ProductVariant[];
  sizeGuideImage?: string;
  offer?: {
    type: 'percentage' | 'fixed';
    value: number;
  };
}

export interface ActivePromotion {
  id: string;
  name: string;
  description: string;
  type: 'nxm' | 'volume_discount' | 'min_purchase' | 'free_shipping' | 'bundle';
  scope: 'global' | 'category' | 'product';
  scopeTargets: string[];
  buyQty: number;
  payQty: number;
  minUnits: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minPurchase: number;
}

export interface CartItem {
  key: string;
  productId: string;
  titulo: string;
  img: string;
  precio: string;
  qty: number;
  size: string;
  color: string;
  variantIndex: number;
}

export interface Client {
  id: string;
  rif_ci: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  currency: 'usd' | 'ves';
  icon: string;
  accountInfo: Record<string, string>;
}

export interface PaymentEntry {
  method: string;
  amountUsd: number;
  amountVes: number;
  ref: string;
  proofUrl?: string;
}

export interface DeliveryZoneGroup {
  price: number;
  zones: string[];
}

export interface DeliveryMethod {
  id: 'pickup' | 'delivery' | 'nacional';
  label: string;
  desc: string;
}

export interface Invoice {
  id?: string;
  numericId: number;
  clientId: string;
  clientSnapshot: Omit<Client, 'id'>;
  date: any; // Firestore Timestamp
  items: InvoiceItem[];
  totalDiscount: { type: string; value: number };
  total: number;
  exchangeRate: number;
  payments: PaymentEntry[];
  status: string;
  abonos: any[];
  changeGiven: number;
  sellerName: string;
  sellerUid: string;
  deliveryType: string;
  deliveryCostUsd: number;
  deliveryZone: string;
  deliveryPaidInStore: boolean;
  observation: string;
}

export interface InvoiceItem {
  productId: string;
  titulo: string;
  name: string;
  quantity: number;
  price: number;
  rowTotal: number;
  size: string;
  color: string;
  variantIndex: number;
  img: string;
}

export interface OrderRating {
  invoiceId: string;
  numericId: string;
  clientId: string;
  rating: number;
  comment: string;
  createdAt: any;
  platform: string;
}

export type Gender = 'Hombre' | 'Mujer';

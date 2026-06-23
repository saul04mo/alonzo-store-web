'use client';

import { useRouter } from 'next/navigation';
import { CartPage } from '@/components/cart/CartPage';

export default function Page() {
  const router = useRouter();

  // El checkout admite compra como invitado, así que "Continuar" va directo
  // al pago sin obligar a iniciar sesión.
  return <CartPage onCheckout={() => router.push('/checkout')} />;
}

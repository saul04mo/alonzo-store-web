'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CartPage } from '@/components/cart/CartPage';
import { AuthModal } from '@/components/auth/AuthModal';
import { useClientStore } from '@/stores';

export default function Page() {
  const router = useRouter();
  const client = useClientStore((s) => s.client);
  const [authOpen, setAuthOpen] = useState(false);

  return (
    <>
      <CartPage
        onCheckout={() => {
          if (!client) {
            setAuthOpen(true);
          } else {
            router.push('/checkout');
          }
        }}
      />
      {authOpen && (
        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onSuccess={() => {
            setAuthOpen(false);
            router.push('/checkout');
          }}
        />
      )}
    </>
  );
}

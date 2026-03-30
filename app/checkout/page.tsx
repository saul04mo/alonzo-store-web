'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckoutPage } from '@/components/checkout/CheckoutPage';
import { OrderSuccess } from '@/components/checkout/OrderSuccess';
import { AuthModal } from '@/components/auth/AuthModal';
import { useClientStore } from '@/stores';
import type { Invoice } from '@/types';

export default function Page() {
  const router = useRouter();
  const client = useClientStore((s) => s.client);
  const [authOpen, setAuthOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successData, setSuccessData] = useState<{
    invoice: Invoice;
    numericId: number;
    docId: string;
  } | null>(null);

  if (!client) {
    return (
      <div className="text-center py-20 font-sans">
        <p className="mb-6 text-sm text-alonzo-gray-600">
          Debes iniciar sesión para continuar al pago.
        </p>
        <button
          onClick={() => setAuthOpen(true)}
          className="bg-black text-white px-8 py-3 uppercase text-xs font-bold tracking-widest hover:bg-gray-800 transition-colors"
        >
          Iniciar Sesión
        </button>
        {authOpen && (
          <AuthModal
            open={authOpen}
            onClose={() => setAuthOpen(false)}
            onSuccess={() => setAuthOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <>
      <CheckoutPage
        onSuccess={(invoiceData: any, numericId: number, docId: string) => {
          setSuccessData({ invoice: invoiceData, numericId, docId });
          setSuccessOpen(true);
        }}
      />
      {successOpen && successData && (
        <OrderSuccess
          open={successOpen}
          onClose={() => {
            setSuccessOpen(false);
            router.push('/account/orders');
          }}
          invoiceData={successData.invoice}
          numericId={successData.numericId}
          docId={successData.docId}
          clientId={client.id || ''}
        />
      )}
    </>
  );
}

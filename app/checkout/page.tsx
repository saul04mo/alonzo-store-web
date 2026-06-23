'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CheckoutPage } from '@/components/checkout/CheckoutPage';
import { OrderSuccess } from '@/components/checkout/OrderSuccess';
import { AuthModal } from '@/components/auth/AuthModal';
import { useClientStore } from '@/stores';
import { auth, signInAnonymously, onAuthStateChanged } from '@/lib/firebase-client';
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

  // El checkout NO obliga a iniciar sesión (compra como invitado), pero sí
  // necesita una sesión de Firebase para que carguen datos protegidos (tasa de
  // cambio) y para crear la orden / subir el comprobante. Si no hay sesión,
  // creamos una anónima ANTES de montar el checkout, de modo que el listener
  // de la tasa se conecte ya autenticado (un listener que falla por permisos
  // no se reintenta solo). Requiere el proveedor "Anonymous" en Firebase Auth.
  const [authReady, setAuthReady] = useState(!!auth.currentUser);

  useEffect(() => {
    if (auth.currentUser) {
      setAuthReady(true);
      return;
    }
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) setAuthReady(true);
    });
    // Si falla (p. ej. proveedor anónimo deshabilitado), igual montamos el
    // checkout; el guard de envío mostrará el error al confirmar.
    signInAnonymously(auth).catch(() => setAuthReady(true));
    return () => unsub();
  }, []);

  if (!authReady) {
    return (
      <div className="flex items-center justify-center py-32 font-sans">
        <div className="w-7 h-7 border-2 border-alonzo-gray-300 border-t-alonzo-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Acceso opcional a la cuenta — solo un atajo para clientes que ya
          tienen cuenta y quieren autocompletar sus datos. */}
      {!client && (
        <div className="w-full max-w-[1400px] mx-auto px-5 md:px-10 pt-6 font-sans">
          <p className="text-sm text-alonzo-gray-600">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={() => setAuthOpen(true)}
              className="underline font-medium text-black hover:text-alonzo-charcoal transition-colors"
            >
              Inicia sesión
            </button>{' '}
            para autocompletar tus datos, o continúa como invitado.
          </p>
        </div>
      )}

      <CheckoutPage
        onSuccess={(invoiceData: any, numericId: number, docId: string) => {
          setSuccessData({ invoice: invoiceData, numericId, docId });
          setSuccessOpen(true);
        }}
      />

      {authOpen && (
        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onSuccess={() => setAuthOpen(false)}
        />
      )}

      {successOpen && successData && (
        <OrderSuccess
          open={successOpen}
          onClose={() => {
            setSuccessOpen(false);
            // Los invitados no tienen historial de pedidos accesible; los
            // clientes con cuenta sí.
            router.push(client ? '/account/orders' : '/');
          }}
          invoiceData={successData.invoice}
          numericId={successData.numericId}
          docId={successData.docId}
          clientId={successData.invoice.clientId || client?.id || ''}
          isGuest={!client}
        />
      )}
    </>
  );
}

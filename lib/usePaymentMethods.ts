'use client';

import { useState, useEffect } from 'react';
import { db, collection, getDocs } from '@/lib/firebase-client';
import type { PaymentMethod } from '@/types';

let cachedMethods: PaymentMethod[] | null = null;

export function usePaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>(cachedMethods || []);
  const [loading, setLoading] = useState(!cachedMethods);

  useEffect(() => {
    if (cachedMethods) {
      setMethods(cachedMethods);
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);

        // Sin orderBy ni where — no necesita índice
        const snapshot = await getDocs(collection(db, 'payment_methods'));

        const loaded: PaymentMethod[] = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return {
              id: data.id || doc.id,
              name: data.name,
              currency: data.currency,
              icon: data.icon,
              accountInfo: data.accountInfo || {},
              _order: data.order || 99,
              _active: data.active,
            };
          })
          .filter((m: any) => m._active !== false)
          .sort((a: any, b: any) => a._order - b._order)
          .map(({ _order, _active, ...rest }: any) => rest);

        if (loaded.length > 0) {
          cachedMethods = loaded;
          setMethods(loaded);
        } else {
          throw new Error('Vacía');
        }
      } catch (err) {
        console.warn('Firestore payment_methods falló, usando fallback:', err);
        const { paymentOptions } = await import('@/config/payments');
        cachedMethods = paymentOptions;
        setMethods(paymentOptions);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { methods, loading };
}

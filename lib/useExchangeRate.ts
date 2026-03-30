'use client';

import { useEffect } from 'react';
import { db, doc, onSnapshot } from '@/lib/firebase-client';
import { useConfigStore } from '@/stores';

export function useExchangeRate() {
  const setExchangeRate = useConfigStore((s) => s.setExchangeRate);
  const exchangeRate = useConfigStore((s) => s.exchangeRate);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'exchangeRate'), (snap) => {
      if (snap.exists()) {
        const value = snap.data().value || 1;
        setExchangeRate(value);
      }
    });
    return unsub;
  }, [setExchangeRate]);

  return exchangeRate;
}

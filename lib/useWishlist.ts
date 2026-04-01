'use client';

import { useState, useEffect, useCallback } from 'react';
import { auth } from '@/lib/firebase-client';
import { onAuthStateChanged } from 'firebase/auth';

/**
 * Persistent wishlist using Firestore.
 * Stores product IDs in a single document: wishlists/{uid}
 */
export function useWishlist() {
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uid, setUid] = useState<string | null>(null);

  // Listen for auth changes
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUid(user?.uid || null);
      if (!user) {
        setItems([]);
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // Load wishlist from Firestore
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;

    (async () => {
      try {
        const { db, doc, getDoc } = await import('@/lib/firebase-client');
        const snap = await getDoc(doc(db, 'wishlists', uid));
        if (!cancelled) {
          setItems(snap.exists() ? (snap.data().productIds || []) : []);
        }
      } catch (err) {
        console.error('Error loading wishlist:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [uid]);

  // Save to Firestore
  const persist = useCallback(async (newItems: string[]) => {
    if (!uid) return;
    try {
      const { db, doc, setDoc } = await import('@/lib/firebase-client');
      await setDoc(doc(db, 'wishlists', uid), { productIds: newItems }, { merge: true });
    } catch (err) {
      console.error('Error saving wishlist:', err);
    }
  }, [uid]);

  const toggle = useCallback((productId: string) => {
    setItems((prev) => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter((id) => id !== productId) : [...prev, productId];
      persist(next);
      return next;
    });
  }, [persist]);

  const isInWishlist = useCallback((productId: string) => {
    return items.includes(productId);
  }, [items]);

  const remove = useCallback((productId: string) => {
    setItems((prev) => {
      const next = prev.filter((id) => id !== productId);
      persist(next);
      return next;
    });
  }, [persist]);

  return { items, loading, toggle, isInWishlist, remove, count: items.length };
}

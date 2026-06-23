'use client';

import { useState, useEffect } from 'react';
import { auth, onAuthStateChanged, getRedirectResult, db, doc, getDoc } from '@/lib/firebase-client';
import { useClientStore } from '@/stores';
import type { Client } from '@/types';

/**
 * Escucha el estado de autenticación de Firebase y mantiene el cliente del
 * store en sync. También resuelve el resultado del redirect de Google
 * (login en mobile) y decide si hay que mostrar el onboarding (perfil
 * incompleto: falta rif_ci o teléfono).
 *
 * Lógica movida verbatim desde AppShell — vivía inline en un componente que
 * ya hacía demasiadas cosas. Devuelve el flag de onboarding y su dismiss.
 */
export function useAuthListener(): { showOnboarding: boolean; dismissOnboarding: () => void } {
  const setClient = useClientStore((s) => s.setClient);
  const clearClient = useClientStore((s) => s.clearClient);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    // Handle redirect result (for mobile Google sign-in)
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        console.log('Google redirect sign-in successful:', result.user.email);
        const { setDoc } = await import('firebase/firestore');
        const userRef = doc(db, 'clients', result.user.uid);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            name: result.user.displayName || 'Usuario',
            email: result.user.email || '',
            phone: '', address: '', rif_ci: '',
          });
        }
      }
    }).catch((err) => {
      if (err?.code !== 'auth/popup-closed-by-user') {
        console.error('Redirect result error:', err);
      }
    });

    const unsub = onAuthStateChanged(auth, async (user) => {
      // Los invitados (checkout sin cuenta) usan sesión anónima: no son
      // clientes con cuenta, así que no cargamos perfil ni mostramos onboarding.
      if (user && !user.isAnonymous) {
        try {
          const userRef = doc(db, 'clients', user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = { id: user.uid, ...userSnap.data() } as Client;
            setClient(data);
            // Check if profile is incomplete
            if (!data.rif_ci || !data.phone) {
              setShowOnboarding(true);
            }
          } else {
            const { setDoc } = await import('firebase/firestore');
            const newClient = {
              id: user.uid,
              name: user.displayName || 'Usuario',
              email: user.email || '',
              phone: '',
              address: '',
              rif_ci: '',
            };
            await setDoc(userRef, newClient);
            setClient(newClient);
            setShowOnboarding(true);
          }
        } catch (err) {
          console.error('Error loading client:', err);
        }
      } else {
        clearClient();
        setShowOnboarding(false);
      }
    });
    return () => unsub();
  }, [setClient, clearClient]);

  return { showOnboarding, dismissOnboarding: () => setShowOnboarding(false) };
}

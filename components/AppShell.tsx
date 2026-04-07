'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ToastProvider,
  useToast,
  BottomNav,
  AnnouncementBar,
  SiteHeader,
  SiteFooter,
  CartDrawer,
} from '@/components/ui';
import { useCartStore, useClientStore, useUIStore } from '@/stores';
import { SizeSelector } from '@/components/products/SizeSelector';
import { AuthModal } from '@/components/auth/AuthModal';
import { OnboardingModal } from '@/components/auth/OnboardingModal';
import { auth, onAuthStateChanged, db, doc, getDoc } from '@/lib/firebase-client';
import { prefetchAllProducts, fetchProducts } from '@/lib/api';
import { hombreCategoryOrder } from '@/config';
import type { Product, ProductVariant, Client } from '@/types';

function ShellContent({ children }: { children: React.ReactNode }) {
  const toast = useToast();
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const { addItem } = useCartStore();
  const client = useClientStore((s) => s.client);
  const setClient = useClientStore((s) => s.setClient);
  const clearClient = useClientStore((s) => s.clearClient);

  const gender = useUIStore((s) => s.gender);
  const setGender = useUIStore((s) => s.setGender);
  const searchTerm = useUIStore((s) => s.searchTerm);
  const setSearchTerm = useUIStore((s) => s.setSearchTerm);
  const authOpen = useUIStore((s) => s.authOpen);
  const setAuthOpen = useUIStore((s) => s.setAuthOpen);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Cart expiry
  useEffect(() => {
    useCartStore.getState().checkExpiry();
  }, []);

  // Pre-fetch all products + categories on app start
  useEffect(() => {
    const setCats = useUIStore.getState().setCategoriesForGender;

    const loadGender = async (g: 'Hombre' | 'Mujer') => {
      try {
        const products = await fetchProducts(g);
        const unique = new Set<string>();
        products.forEach((p) => {
          const cat = p.category.trim().toUpperCase();
          if (cat && cat !== 'EXTRAS') unique.add(cat);
        });
        const arr = Array.from(unique);
        if (g === 'Mujer') {
          arr.sort((a, b) => b.localeCompare(a));
        } else {
          arr.sort((a, b) => {
            const wA = hombreCategoryOrder[a] || 99;
            const wB = hombreCategoryOrder[b] || 99;
            return wA !== wB ? wA - wB : a.localeCompare(b);
          });
        }
        setCats(g, arr);
      } catch { }
    };

    loadGender('Hombre');
    loadGender('Mujer');
  }, []);

  // Auth state listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
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
            const newClient = {
              id: user.uid,
              name: user.displayName || 'Usuario',
              email: user.email || '',
              phone: '',
              address: '',
              rif_ci: '',
            };
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

  const handleGenderChange = useCallback((g: 'Hombre' | 'Mujer') => {
    setGender(g);
    // Propagate via URL param or context — pages read this
    if (pathname !== '/') router.push('/');
  }, [pathname, router]);

  const handleSizeSelect = useCallback(
    (variant: ProductVariant, variantIndex: number) => {
      if (!selectedProduct) return;
      const itemKey = `${selectedProduct.id}-${variant.size}-${variant.color}`;
      addItem({
        key: itemKey,
        productId: selectedProduct.id,
        titulo: selectedProduct.name,
        img: selectedProduct.imageUrl,
        precio: variant.price,
        qty: 1,
        size: variant.size,
        color: variant.color,
        variantIndex,
      });
      toast.show('AÑADIDO AL CARRITO');
      setSizeOpen(false);
    },
    [selectedProduct, addItem, toast]
  );

  return (
    <div className="min-h-screen bg-white">
      <SiteHeader
        gender={gender}
        onGenderChange={handleGenderChange}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onCartOpen={() => useUIStore.getState().setCartDrawerOpen(true)}
        onProfileOpen={() => (client ? router.push('/account') : setAuthOpen(true))}
        searchRef={searchRef}
      />

      <main className="pb-24 md:pb-10">{children}</main>

      <SiteFooter />

      <CartDrawer />

      <SizeSelector
        product={selectedProduct}
        open={sizeOpen}
        onClose={() => setSizeOpen(false)}
        onSelect={handleSizeSelect}
      />

      {authOpen && (
        <AuthModal
          open={authOpen}
          onClose={() => setAuthOpen(false)}
          onSuccess={() => {
            setAuthOpen(false);
            if (pathname === '/cart' || pathname === '/checkout') {
              router.push('/checkout');
            }
          }}
        />
      )}

      {showOnboarding && client && (
        <OnboardingModal
          client={client}
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      {/* Floating WhatsApp Button */}
      <a
        href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '584123380976'}?text=${encodeURIComponent('Hola ALONZO, me gustaría recibir más información.')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-[200] w-[54px] h-[54px] bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all duration-300"
        aria-label="Contactar por WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 ml-0.5 mt-0.5">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
        </svg>
      </a>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ShellContent>{children}</ShellContent>
    </ToastProvider>
  );
}
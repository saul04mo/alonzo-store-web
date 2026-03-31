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
} from '@/components/ui';
import { useCartStore, useClientStore, useUIStore } from '@/stores';
import { SizeSelector } from '@/components/products/SizeSelector';
import { AuthModal } from '@/components/auth/AuthModal';
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

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);

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
            setClient({ id: user.uid, ...userSnap.data() } as Client);
          } else {
            setClient({
              id: user.uid,
              name: user.displayName || 'Usuario',
              email: user.email || '',
              phone: '',
              address: '',
              rif_ci: '',
            });
          }
        } catch (err) {
          console.error('Error loading client:', err);
        }
      } else {
        clearClient();
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
      <AnnouncementBar text="Envío gratis en compras mayores a $50." linkText="Ver más" />

      <SiteHeader
        gender={gender}
        onGenderChange={handleGenderChange}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onCartOpen={() => router.push('/cart')}
        onProfileOpen={() => (client ? router.push('/account') : setAuthOpen(true))}
        searchRef={searchRef}
      />

      <main className="pb-24 md:pb-10">{children}</main>

      <footer className="hidden md:block border-t border-alonzo-gray-200">
        <div className="max-w-[1400px] mx-auto px-10 py-8 flex justify-between items-center">
          <span className="text-2xs text-alonzo-gray-500 tracking-wider">
            &copy; 2025 ALONZO. Todos los derechos reservados.
          </span>
          <div className="flex gap-6 text-2xs text-alonzo-gray-500 tracking-wider">
            <a href="#" className="hover:text-alonzo-black transition-colors">Contacto</a>
            <Link href="/terms" className="hover:text-alonzo-black transition-colors">Términos</Link>
            <Link href="/privacy" className="hover:text-alonzo-black transition-colors">Privacidad</Link>
          </div>
        </div>
      </footer>

      <div className="md:hidden">
        <BottomNav
          onCartOpen={() => router.push('/cart')}
          onProfileOpen={() => (client ? router.push('/account') : setAuthOpen(true))}
          onSearchFocus={() => searchRef.current?.focus()}
        />
      </div>

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
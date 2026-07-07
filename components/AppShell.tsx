'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  ToastProvider,
  useToast,
  SiteHeader,
  SiteFooter,
  CartDrawer,
  InstallPrompt,
  TopLoader,
} from '@/components/ui';
import { useCartStore, useClientStore, useUIStore } from '@/stores';
import { SizeSelector } from '@/components/products/SizeSelector';
import { AuthModal } from '@/components/auth/AuthModal';
import { OnboardingModal } from '@/components/auth/OnboardingModal';
import { useWebSettings } from '@/lib/useWebSettings';
import { useAuthListener } from '@/lib/useAuthListener';
import { fetchProducts } from '@/lib/api';
import { computeCategories } from '@/lib/categories';
import type { Product, ProductVariant } from '@/types';
import type { Announcement } from '@/lib/getAnnouncements';

function ShellContent({ children, announcements }: { children: React.ReactNode; announcements: Announcement[] }) {
  const toast = useToast();
  const searchRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  // Load web settings early — re-renders all children when Firestore responds
  const webSettings = useWebSettings();

  const { addItem } = useCartStore();
  const client = useClientStore((s) => s.client);

  const gender = useUIStore((s) => s.gender);
  const setGender = useUIStore((s) => s.setGender);
  const searchTerm = useUIStore((s) => s.searchTerm);
  const setSearchTerm = useUIStore((s) => s.setSearchTerm);
  const authOpen = useUIStore((s) => s.authOpen);
  const setAuthOpen = useUIStore((s) => s.setAuthOpen);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [sizeOpen, setSizeOpen] = useState(false);

  // Auth listener (login state + onboarding) — ver lib/useAuthListener.ts
  const { showOnboarding, dismissOnboarding } = useAuthListener();

  // Cart expiry
  useEffect(() => {
    useCartStore.getState().checkExpiry();
  }, []);

  // Register Service Worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  // Pre-fetch all products + categories on app start
  useEffect(() => {
    const setCats = useUIStore.getState().setCategoriesForGender;

    const loadGender = async (g: 'Hombre' | 'Mujer') => {
      try {
        const products = await fetchProducts(g);
        setCats(g, computeCategories(products, g));
      } catch { }
    };

    loadGender('Hombre');
    loadGender('Mujer');
  }, []);

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
      <TopLoader />
      <SiteHeader
        gender={gender}
        onGenderChange={handleGenderChange}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onCartOpen={() => useUIStore.getState().setCartDrawerOpen(true)}
        onProfileOpen={() => (client ? router.push('/account') : setAuthOpen(true))}
        searchRef={searchRef}
        announcements={announcements}
      />

      <main className="pb-24 md:pb-10">{children}</main>

      {/* El footer se oculta en el checkout: sus enlaces (ayuda, redes, devoluciones)
          distraen y sacan al cliente del flujo de compra. */}
      {pathname !== '/checkout' && <SiteFooter />}

      <CartDrawer />

      <InstallPrompt />

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
          onComplete={dismissOnboarding}
        />
      )}

      {/* Floating WhatsApp Button */}
      <a
        href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '584123380976'}?text=${encodeURIComponent('Hola ALONZO, me gustaría recibir más información.')}`}
        target="_blank"
        rel="noopener noreferrer"
        className={`fixed ${pathname === '/checkout' || pathname === '/cart' || pathname.startsWith('/product/') ? 'bottom-28 lg:bottom-6' : 'bottom-6'} right-6 z-[200] w-[54px] h-[54px] bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all duration-300`}
        aria-label="Contactar por WhatsApp"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 ml-0.5 mt-0.5">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
        </svg>
      </a>
    </div>
  );
}

export function AppShell({ children, announcements }: { children: React.ReactNode; announcements: Announcement[] }) {
  return (
    <ToastProvider>
      <ShellContent announcements={announcements}>{children}</ShellContent>
    </ToastProvider>
  );
}
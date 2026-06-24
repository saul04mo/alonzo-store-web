'use client';
import { useClientStore, useUIStore } from '@/stores';
import { useHydratedClient } from '@/lib/useHydratedClient';
import { LogOut, Package, ShieldCheck, MapPin, ChevronRight, Heart, Ticket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { auth, signOut } from '@/lib/firebase-client';
import { useToast } from '@/components/ui';
import { useWishlist } from '@/lib/useWishlist';

export function AccountPage() {
  const { client, hydrated } = useHydratedClient();
  const clearClient = useClientStore((s) => s.clearClient);
  const setAuthOpen = useUIStore((s) => s.setAuthOpen);
  const router = useRouter();
  const toast = useToast();
  const { count: wishlistCount } = useWishlist();

  // Mientras el store rehidrata, no decidimos aún si mostrar login.
  // Evita el flash de "Debes iniciar sesión" para un usuario logueado.
  if (!hydrated) {
    return <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-12 md:py-20 min-h-[70vh]" />;
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      clearClient();
      router.push('/');
      toast.show('SESIÓN CERRADA');
    } catch (err) {
      console.error(err);
      toast.show('ERROR AL CERRAR SESIÓN');
    }
  };

  if (!client) {
    return (
      <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-20 text-center font-sans">
        <h1 className="text-2xl font-medium mb-4">Mi Cuenta</h1>
        <p className="text-alonzo-gray-600 mb-8">Debes iniciar sesión para ver tu perfil.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={() => router.push('/')}
            className="border border-alonzo-black text-alonzo-black px-8 py-3 uppercase text-xs font-bold tracking-widest hover:bg-alonzo-gray-100 transition-colors w-full sm:w-auto"
          >
            Ir al inicio
          </button>
          <button
            onClick={() => setAuthOpen(true)}
            className="bg-alonzo-black text-white px-8 py-3 uppercase text-xs font-bold tracking-widest hover:bg-alonzo-dark transition-colors w-full sm:w-auto"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    );
  }

  const cards = [
    {
      id: 'orders',
      title: 'PEDIDOS Y DEVOLUCIONES',
      description: 'Rastrea tus pedidos o inicia una devolución',
      icon: <Package size={24} strokeWidth={1.2} />,
      onClick: () => router.push('/account/orders'),
    },
    {
      id: 'details',
      title: 'DETALLES Y SEGURIDAD',
      description: 'Administra tu inicio de sesión y contraseña',
      icon: <ShieldCheck size={24} strokeWidth={1.2} />,
      onClick: () => router.push('/account/details'),
    },
    {
      id: 'addresses',
      title: 'MIS DIRECCIONES',
      description: 'Revisa tu dirección de facturación y de envío guardadas',
      icon: <MapPin size={24} strokeWidth={1.2} />,
      onClick: () => router.push('/account/details#addresses'),
    },
    {
      id: 'wishlist',
      title: 'MIS FAVORITOS',
      description: wishlistCount > 0 ? `Tienes ${wishlistCount} producto${wishlistCount > 1 ? 's' : ''} guardado${wishlistCount > 1 ? 's' : ''}` : 'Guarda tus productos favoritos para después',
      icon: <Heart size={24} strokeWidth={1.2} />,
      onClick: () => router.push('/account/wishlist'),
    },
    {
      id: 'coupons',
      title: 'MIS CUPONES',
      description: 'Consulta tus cupones de descuento disponibles',
      icon: <Ticket size={24} strokeWidth={1.2} />,
      onClick: () => router.push('/account/coupons'),
    },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-10 py-12 md:py-20 font-sans min-h-[70vh]">
      {/* Header */}
      <div className="mb-14">
        <h1 className="text-[24px] md:text-[28px] font-light text-alonzo-black leading-tight tracking-tight">
          te damos la bienvenida a tu cuenta, <span className="capitalize">{client.name.split(' ')[0].toLowerCase()}</span>
        </h1>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={card.onClick}
            className="group flex flex-col p-10 border border-alonzo-gray-300 hover:border-alonzo-black hover:bg-alonzo-gray-100 hover:-translate-y-0.5 transition-all duration-300 ease-out text-left bg-white h-[220px]"
          >
            <div className="text-alonzo-black mb-5">{card.icon}</div>
            <h3 className="text-sm md:text-base font-bold tracking-normal text-alonzo-black mb-3 uppercase">
              {card.title}
            </h3>
            <p className="text-sm text-alonzo-gray-600 leading-relaxed font-normal">
              {card.description}
            </p>
            <ChevronRight
              size={16}
              className="mt-auto text-alonzo-gray-400 group-hover:text-alonzo-black group-hover:translate-x-1.5 transition-all duration-300"
            />
          </button>
        ))}

        {/* Sign Out Card */}
        <button
          onClick={handleSignOut}
          className="flex flex-col p-8 border border-alonzo-gray-200 hover:border-red-200 hover:bg-red-50/30 transition-all text-left h-full group"
        >
          <div className="text-red-400 mb-6 group-hover:rotate-12 transition-transform">
            <LogOut size={24} strokeWidth={1.2} />
          </div>
          <h3 className="text-sm font-bold tracking-wider text-red-500 mb-3 uppercase">
            CERRAR SESIÓN
          </h3>
          <p className="text-sm text-alonzo-gray-600 leading-relaxed font-normal">
            Finaliza tu sesión actual de forma segura
          </p>
        </button>
      </div>
    </div>
  );
}

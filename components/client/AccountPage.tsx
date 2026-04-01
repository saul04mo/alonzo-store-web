'use client';
import { useClientStore } from '@/stores';
import { LogOut, Package, ShieldCheck, MapPin, ChevronRight, Heart, Ticket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { auth, signOut } from '@/lib/firebase-client';
import { useToast } from '@/components/ui';
import { useWishlist } from '@/lib/useWishlist';

export function AccountPage() {
  const { client, clearClient } = useClientStore();
  const router = useRouter();
  const toast = useToast();
  const { count: wishlistCount } = useWishlist();

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
        <p className="text-gray-500 mb-8">Debes iniciar sesión para ver tu perfil.</p>
        <button 
          onClick={() => router.push('/')} 
          className="bg-black text-white px-8 py-3 uppercase text-xs font-bold tracking-widest hover:bg-gray-800 transition-colors"
        >
          Ir al inicio
        </button>
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
        <h1 className="text-[24px] md:text-[28px] font-light text-black leading-tight tracking-tight">
          te damos la bienvenida a tu cuenta, <span className="capitalize">{client.name.split(' ')[0].toLowerCase()}</span>
        </h1>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={card.onClick}
            className="group flex flex-col p-10 border border-gray-200 hover:border-black hover:bg-gray-50/30 hover:shadow-sm hover:-translate-y-0.5 transition-all duration-300 ease-out text-left bg-white h-[220px]"
          >
            <h3 className="text-sm md:text-base font-bold tracking-normal text-black mb-4 uppercase transition-colors group-hover:text-alonzo-black">
              {card.title}
            </h3>
            <p className="text-sm md:text-base text-gray-600 leading-relaxed font-normal transition-colors group-hover:text-gray-900">
              {card.description}
            </p>
            
            <div className="mt-auto pt-4 flex items-center text-[11px] font-bold tracking-widest text-black group-hover:translate-x-1.5 transition-transform duration-300 uppercase">
              EXPLORAR <ChevronRight size={14} className="ml-1" />
            </div>
          </button>
        ))}

        {/* Sign Out Card */}
        <button
          onClick={handleSignOut}
          className="flex flex-col p-8 border border-gray-100 hover:border-red-200 hover:bg-red-50/30 transition-all text-left h-full group"
        >
          <div className="text-red-400 mb-6 group-hover:rotate-12 transition-transform">
            <LogOut size={24} strokeWidth={1.2} />
          </div>
          <h3 className="text-sm font-bold tracking-wider text-red-500 mb-3 uppercase">
            CERRAR SESIÓN
          </h3>
          <p className="text-sm text-gray-400 leading-relaxed font-normal">
            Finaliza tu sesión actual de forma segura
          </p>
        </button>
      </div>

      {/* Secondary links (as seen in Farfetch) */}
      <div className="mt-16 pt-12 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <h4 className="text-[11px] font-bold tracking-[0.2em] text-gray-400 mb-6 uppercase">Sobre Alonzo</h4>
          <ul className="space-y-4 text-xs font-medium text-gray-600">
            <li><button onClick={() => router.push('/terms')} className="hover:text-black transition-colors uppercase tracking-wider">Términos y condiciones</button></li>
            <li><button onClick={() => router.push('/privacy')} className="hover:text-black transition-colors uppercase tracking-wider">Política de privacidad</button></li>
          </ul>
        </div>
        <div>
          <h4 className="text-[11px] font-bold tracking-[0.2em] text-gray-400 mb-6 uppercase">Ayuda</h4>
          <ul className="space-y-4 text-xs font-medium text-gray-600">
            <li><button className="hover:text-black transition-colors uppercase tracking-wider">Contacto</button></li>
            <li><button className="hover:text-black transition-colors uppercase tracking-wider">Preguntas frecuentes</button></li>
          </ul>
        </div>
      </div>
    </div>
  );
}

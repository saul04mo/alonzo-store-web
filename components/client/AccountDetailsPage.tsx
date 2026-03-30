'use client';
import { useState, useEffect } from 'react';
import { useClientStore } from '@/stores';
import { findClientByRif, saveClient } from '@/lib/api';
import { useToast } from '@/components/ui';
import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

export function AccountDetailsPage() {
  const toast = useToast();
  const router = useRouter();
  const { client, setClient } = useClientStore();

  const [rif, setRif] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (client) {
      setRif(client.rif_ci || '');
      setName(client.name || '');
      setPhone(client.phone || '');
      setEmail(client.email || '');
      setAddress(client.address || '');
      
      // Scroll to hash if present (e.g. #addresses)
      if (window.location.hash) {
        setTimeout(() => {
          const el = document.getElementById(window.location.hash.substring(1));
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
    } else {
      router.push('/account');
    }
  }, [client, router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rif || !name) {
      toast.show('FALTAN DATOS (RIF/NOMBRE)');
      return;
    }

    setIsSaving(true);
    const data = { rif_ci: rif, name, phone, email, address };

    try {
      const existing = await findClientByRif(rif);
      const saved = await saveClient(data, existing?.id || client?.id);
      setClient(saved);
      toast.show('DATOS ACTUALIZADOS CORRECTAMENTE');
    } catch (err) {
      console.error(err);
      toast.show('ERROR AL GUARDAR');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto px-4 md:px-10 py-12 font-sans">
      {/* Breadcrumb / Back */}
      <button 
        onClick={() => router.push('/account')}
        className="flex items-center text-[11px] font-bold tracking-widest text-gray-400 hover:text-black transition-colors mb-8 uppercase"
      >
        <ChevronLeft size={14} className="mr-1" /> VOLVER A MI CUENTA
      </button>

      <h1 className="text-[24px] md:text-[28px] font-light text-black leading-tight tracking-tight mb-2">Detalles y Seguridad</h1>
      <p className="text-sm text-gray-500 mb-12">Gestiona tu información personal y de contacto.</p>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-gray-900 uppercase tracking-wider block">RIF / CI (Identificación)</label>
            <input
              type="text"
              className="w-full border-b border-gray-300 focus:border-black bg-transparent text-[15px] py-2 outline-none transition-colors rounded-none disabled:text-gray-400"
              placeholder="V-12345678"
              value={rif}
              onChange={(e) => setRif(e.target.value)}
              disabled={!!client?.rif_ci}
              required
            />
            {!!client?.rif_ci && <p className="text-[10px] text-gray-400 italic">Dato verificado: no se puede modificar.</p>}
          </div>
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-gray-900 uppercase tracking-wider block">Nombre Completo</label>
            <input
              type="text"
              className="w-full border-b border-gray-300 focus:border-black bg-transparent text-[15px] py-2 outline-none transition-colors rounded-none"
              placeholder="Ej. Jose Montero"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-gray-900 uppercase tracking-wider block">Teléfono</label>
            <input
              type="tel"
              className="w-full border-b border-gray-300 focus:border-black bg-transparent text-[15px] py-2 outline-none transition-colors rounded-none disabled:text-gray-400"
              placeholder="0412 000 0000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={!!client?.phone}
            />
            {!!client?.phone && <p className="text-[10px] text-gray-400 italic">Dato verificado: no se puede modificar.</p>}
          </div>
          <div className="space-y-2">
            <label className="text-[13px] font-bold text-gray-900 uppercase tracking-wider block">Email</label>
            <input
              type="email"
              className="w-full border-b border-gray-300 focus:border-black bg-transparent text-[15px] py-2 outline-none transition-colors rounded-none disabled:text-gray-400"
              value={email}
              disabled
              title="El email no puede ser modificado"
            />
            <p className="text-[10px] text-gray-400 italic">Vinculado a tu cuenta de acceso</p>
          </div>
        </div>

        <div id="addresses" className="space-y-2">
          <label className="text-[13px] font-bold text-gray-900 uppercase tracking-wider block">Dirección Predeterminada</label>
          <textarea
            rows={2}
            className="w-full border-b border-gray-300 focus:border-black bg-transparent text-[15px] py-2 outline-none transition-colors rounded-none resize-none"
            placeholder="Calle, Edificio, Apto..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={isSaving}
            className="btn-primary w-full md:w-auto md:px-12 py-4 bg-black text-white hover:bg-gray-800 transition-colors uppercase text-xs font-bold tracking-widest disabled:bg-gray-400"
          >
            {isSaving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
          </button>
        </div>
      </form>
    </div>
  );
}

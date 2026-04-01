'use client';

import { useState } from 'react';
import { useClientStore } from '@/stores';
import { useToast } from '@/components/ui';
import { db, doc, setDoc } from '@/lib/firebase-client';
import type { Client } from '@/types';

interface OnboardingModalProps {
  client: Client;
  onComplete: () => void;
}

export function OnboardingModal({ client, onComplete }: OnboardingModalProps) {
  const toast = useToast();
  const { setClient } = useClientStore();

  const [name, setName] = useState(client.name && client.name !== 'Usuario' ? client.name : '');
  const [rifCi, setRifCi] = useState(client.rif_ci || '');
  const [phone, setPhone] = useState(client.phone || '');
  const [address, setAddress] = useState(client.address || '');
  const [saving, setSaving] = useState(false);

  const canSubmit = name.trim() && rifCi.trim() && phone.trim();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSaving(true);
    try {
      const updatedData = {
        name: name.trim(),
        rif_ci: rifCi.trim(),
        phone: phone.trim(),
        address: address.trim(),
        email: client.email || '',
      };

      await setDoc(doc(db, 'clients', client.id), updatedData, { merge: true });

      setClient({ ...client, ...updatedData });
      toast.show('¡PERFIL COMPLETADO!');
      onComplete();
    } catch (err) {
      console.error('Error saving onboarding:', err);
      toast.show('ERROR AL GUARDAR. INTENTA DE NUEVO.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-[6000] backdrop-blur-sm animate-fade-in" />

      <div className="fixed inset-0 z-[6010] flex items-center justify-center p-4">
        <div className="w-full max-w-[480px] bg-white shadow-2xl rounded-sm font-sans animate-fade-in">
          {/* Header */}
          <div className="p-8 pb-0 text-center">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-5">
              <span className="text-white text-2xl">✨</span>
            </div>
            <h2 className="text-xl font-medium text-gray-900">
              ¡Bienvenido a ALONZO!
            </h2>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              Completa tus datos para una mejor experiencia de compra.
              <br />
              Solo te tomará un momento.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            <div>
              <label className="text-[13px] font-semibold text-gray-900 block mb-2 uppercase tracking-wider">
                Nombre completo <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 focus:border-black bg-white text-[15px] py-3 px-4 outline-none transition-colors rounded-sm"
                placeholder="Ej. María García"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[13px] font-semibold text-gray-900 block mb-2 uppercase tracking-wider">
                  RIF / CI <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 focus:border-black bg-white text-[15px] py-3 px-4 outline-none transition-colors rounded-sm"
                  placeholder="V12345678"
                  value={rifCi}
                  onChange={(e) => setRifCi(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[13px] font-semibold text-gray-900 block mb-2 uppercase tracking-wider">
                  Teléfono <span className="text-red-400">*</span>
                </label>
                <input
                  type="tel"
                  className="w-full border border-gray-300 focus:border-black bg-white text-[15px] py-3 px-4 outline-none transition-colors rounded-sm"
                  placeholder="0412 000 0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-[13px] font-semibold text-gray-900 block mb-2 uppercase tracking-wider">
                Dirección
              </label>
              <input
                type="text"
                className="w-full border border-gray-300 focus:border-black bg-white text-[15px] py-3 px-4 outline-none transition-colors rounded-sm"
                placeholder="Calle, edificio, ciudad..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              <p className="text-[10px] text-gray-400 mt-1.5">Opcional — puedes agregarla después</p>
            </div>

            <button
              type="submit"
              disabled={!canSubmit || saving}
              className="w-full py-4 mt-2 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-900 transition-colors rounded-sm disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {saving ? 'GUARDANDO...' : 'COMPLETAR MI PERFIL'}
            </button>

            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
              Estos datos se usarán para procesar tus pedidos y generar facturas.
            </p>
          </form>
        </div>
      </div>
    </>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { Modal, ModalHeader, useToast } from '@/components/ui';
import { useClientStore } from '@/stores';
import { findClientByRif, saveClient } from '@/lib/api';
import { auth, signOut } from '@/lib/firebase-client';

interface ProfileViewProps {
  open: boolean;
  onClose: () => void;
  onOpenOrders: () => void;
}

export function ProfileView({ open, onClose, onOpenOrders }: ProfileViewProps) {
  const toast = useToast();
  const { client, setClient, clearClient } = useClientStore();

  const [rif, setRif] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    if (open && client) {
      setRif(client.rif_ci || '');
      setName(client.name || '');
      setPhone(client.phone || '');
      setEmail(client.email || '');
      setAddress(client.address || '');
    }
  }, [open, client]);

  const handleSave = async () => {
    if (!rif || !name) {
      toast.show('FALTAN DATOS (RIF/NOMBRE)');
      return;
    }

    const data = { rif_ci: rif, name, phone, email, address };

    try {
      const existing = await findClientByRif(rif);
      const saved = await saveClient(data, existing?.id || client?.id);
      setClient(saved);
      toast.show('DATOS GUARDADOS');
    } catch (err) {
      console.error(err);
      toast.show('ERROR AL GUARDAR');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      clearClient();
      onClose();
      toast.show('SESIÓN CERRADA');
    } catch (err) {
      console.error(err);
      toast.show('ERROR AL CERRAR SESIÓN');
    }
  };

  return (
    <Modal open={open} onClose={onClose} zIndex={5000}>
      <ModalHeader title="MI CUENTA" onClose={onClose} />

      <div className="flex-1 overflow-y-auto px-7 pb-24">
        <p className="text-2xs text-alonzo-gray-500 text-center uppercase tracking-wider mb-6">
          Actualiza tu información de contacto
        </p>

        <div className="space-y-5">
          <div>
            <label className="label-luxury">RIF / CI (IDENTIFICACIÓN)</label>
            <input
              type="text"
              className="input-luxury"
              placeholder="V12345678"
              value={rif}
              onChange={(e) => setRif(e.target.value)}
            />
          </div>
          <div>
            <label className="label-luxury">NOMBRE COMPLETO</label>
            <input
              type="text"
              className="input-luxury"
              placeholder="Ricardo Tejada"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="label-luxury">TELÉFONO</label>
            <input
              type="tel"
              className="input-luxury"
              placeholder="0412..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div>
            <label className="label-luxury">EMAIL</label>
            <input
              type="email"
              className="input-luxury"
              placeholder="cliente@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="label-luxury">DIRECCIÓN</label>
            <input
              type="text"
              className="input-luxury"
              placeholder="Tu dirección de envío"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
        </div>

        <button className="btn-primary mt-8" onClick={handleSave}>
          GUARDAR DATOS
        </button>

        <button
          className="btn-outline mt-3"
          onClick={() => {
            if (!client?.id) {
              toast.show('DEBES INGRESAR TUS DATOS PRIMERO');
              return;
            }
            onOpenOrders();
          }}
        >
          VER MIS PEDIDOS ANTERIORES
        </button>

        <button
          className="mt-4 w-full py-3 text-xs font-semibold uppercase tracking-widest text-red-500 hover:text-red-700 transition-colors border border-red-200 hover:border-red-400 rounded"
          onClick={handleSignOut}
        >
          Cerrar sesión
        </button>
      </div>
    </Modal>
  );
}

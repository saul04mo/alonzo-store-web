'use client';
import { useState } from 'react';
import {
  Smartphone, Building2, Banknote, Bitcoin, Wallet, CreditCard, Copy, Check, Upload, Image as ImageIcon,
} from 'lucide-react';
import { useToast } from '@/components/ui';
import { copyToClipboard, cs } from '@/lib/format';
import type { PaymentMethod } from '@/types';

const iconMap: Record<string, typeof Smartphone> = {
  Smartphone, Building2, Banknote, Bitcoin, Wallet, CreditCard,
};

interface PaymentSelection {
  [methodId: string]: { amount: string; ref: string };
}

interface PaymentGridProps {
  paymentMethods: PaymentMethod[];
  selection: PaymentSelection;
  onChange: (selection: PaymentSelection) => void;
  selectedMethod: string | null;
  onMethodSelect: (id: string) => void;
  totalUsd: number;
  exchangeRate: number;
  proofFile: File | null;
  onProofChange: (file: File | null) => void;
}

export function PaymentGrid({
  paymentMethods,
  selection,
  onChange,
  selectedMethod,
  onMethodSelect,
  totalUsd,
  exchangeRate,
  proofFile,
  onProofChange,
}: PaymentGridProps) {
  const toast = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    onMethodSelect(id);
    const method = paymentMethods.find((p) => p.id === id);
    const newSel: PaymentSelection = {};
    newSel[id] = { amount: '', ref: '' };
    // Autocompletamos el monto con el total para que el cliente no tenga que
    // teclearlo (sigue siendo editable por si paga combinado o parcial).
    // USD: el total tal cual. VES: total convertido a Bs con la tasa vigente.
    if (totalUsd > 0) {
      if (method?.currency === 'usd') {
        newSel[id].amount = totalUsd.toFixed(2);
      } else if (method?.currency === 'ves' && exchangeRate > 0) {
        newSel[id].amount = (totalUsd * exchangeRate).toFixed(2);
      }
    }
    onChange(newSel);
    onProofChange(null);
  };

  const handleUpdate = (id: string, field: 'amount' | 'ref', value: string) => {
    const updated = { ...selection };
    if (updated[id]) {
      updated[id] = { ...updated[id], [field]: value };
      onChange(updated);
    }
  };

  const handleCopy = async (key: string, text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1500);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onProofChange(e.target.files?.[0] || null);
  };

  const activeDef = selectedMethod ? paymentMethods.find((p) => p.id === selectedMethod) : null;

  const labels: Record<string, string> = {
    bank: 'Banco', name: 'Nombre', phone: 'Teléfono',
    ci: 'C.I./RIF', email: 'Email', user: 'Usuario',
  };

  return (
    <div className="space-y-4">
      {/* Method selector — cards grid */}
      <div className="grid grid-cols-3 gap-2.5">
        {paymentMethods.map((opt) => {
          const Icon = iconMap[opt.icon] || CreditCard;
          const isActive = opt.id === selectedMethod;
          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={`flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-sm border transition-all duration-200 h-[85px] ${
                isActive
                  ? 'border-alonzo-black bg-alonzo-gray-100'
                  : 'border-alonzo-gray-300 bg-white hover:border-alonzo-gray-400'
              }`}
            >
              <Icon size={20} strokeWidth={1.5} className={isActive ? 'text-alonzo-black' : 'text-alonzo-gray-600'} />
              <span className={`text-[10px] text-center font-semibold leading-tight ${isActive ? 'text-alonzo-black' : 'text-alonzo-gray-600'}`}>
                {opt.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Payment details */}
      {activeDef && (
        <div className="bg-alonzo-gray-100 rounded-sm p-5 space-y-4 page-fade-in">

          {/* Account info */}
          {Object.keys(activeDef.accountInfo).length > 0 && (
            <div className="space-y-0 rounded-sm overflow-hidden border border-alonzo-gray-300">
              {Object.entries(activeDef.accountInfo).map(([key, val], idx, arr) => (
                <div
                  key={key}
                  className={`flex items-center justify-between px-4 py-3 bg-white ${
                    idx < arr.length - 1 ? 'border-b border-alonzo-gray-200' : ''
                  }`}
                >
                  <div>
                    <p className="text-[10px] text-alonzo-gray-600 uppercase tracking-wide">{labels[key] || key}</p>
                    <p className="text-sm font-semibold text-alonzo-black">{val}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(key, val)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-sm text-[10px] font-semibold transition-all ${
                      copiedKey === key
                        ? 'bg-alonzo-gray-100 text-alonzo-charcoal'
                        : 'bg-alonzo-gray-200 text-alonzo-gray-600 hover:bg-alonzo-gray-300'
                    }`}
                  >
                    {copiedKey === key ? <Check size={11} className="text-alonzo-success" /> : <Copy size={11} />}
                    {copiedKey === key ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Amount & reference */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-alonzo-gray-600 uppercase tracking-wide mb-1.5">
                Monto ({activeDef.currency === 'usd' ? cs() : 'Bs.'})
              </label>
              <input
                type="number"
                inputMode="decimal"
                className="w-full px-4 py-3 bg-white border border-alonzo-gray-300 rounded-sm text-sm font-medium text-alonzo-black focus:border-alonzo-black focus:ring-1 focus:ring-alonzo-black outline-none transition-colors placeholder:text-alonzo-gray-500"
                placeholder="0.00"
                value={selection[activeDef.id]?.amount || ''}
                onChange={(e) => handleUpdate(activeDef.id, 'amount', e.target.value)}
              />
            </div>
            {activeDef.id !== 'efectivo_usd' && (
              <div>
                <label className="block text-[10px] font-semibold text-alonzo-gray-600 uppercase tracking-wide mb-1.5">
                  Referencia
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white border border-alonzo-gray-300 rounded-sm text-sm font-medium text-alonzo-black focus:border-alonzo-black focus:ring-1 focus:ring-alonzo-black outline-none transition-colors placeholder:text-alonzo-gray-500"
                  placeholder="Últimos 4-6 dígitos"
                  value={selection[activeDef.id]?.ref || ''}
                  onChange={(e) => handleUpdate(activeDef.id, 'ref', e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Proof upload */}
      {selectedMethod && selectedMethod !== 'efectivo_usd' && (
        <label
          htmlFor="proof-upload"
          className={`flex items-center justify-center gap-3 w-full py-4 rounded-sm border-2 border-dashed cursor-pointer transition-all duration-200 ${
            proofFile
              ? 'bg-alonzo-gray-100 border-alonzo-success'
              : 'bg-white border-alonzo-gray-400 hover:border-alonzo-gray-500'
          }`}
        >
          {proofFile ? (
            <>
              <Check size={18} className="text-alonzo-success" />
              <div className="text-center">
                <p className="text-xs font-semibold text-alonzo-charcoal">Comprobante cargado</p>
                <p className="text-[10px] text-alonzo-gray-600 mt-0.5">{proofFile.name}</p>
              </div>
            </>
          ) : (
            <>
              <Upload size={18} className="text-alonzo-gray-600" />
              <div>
                <p className="text-xs font-semibold text-alonzo-gray-600">Adjuntar comprobante</p>
                <p className="text-[10px] text-alonzo-gray-600">Foto del pago o captura de pantalla</p>
              </div>
            </>
          )}
          <input
            type="file"
            id="proof-upload"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      )}
    </div>
  );
}

export type { PaymentSelection };

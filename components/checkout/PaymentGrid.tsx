'use client';
import { useState } from 'react';
import {
  Smartphone, Building2, Banknote, Bitcoin, Wallet, CreditCard, Copy, Camera,
} from 'lucide-react';
import { useToast } from '@/components/ui';
import { copyToClipboard } from '@/lib/format';
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
  proofFile,
  onProofChange,
}: PaymentGridProps) {
  const toast = useToast();

  const handleSelect = (id: string) => {
    onMethodSelect(id);
    const method = paymentMethods.find((p) => p.id === id);
    const newSel: PaymentSelection = {};
    newSel[id] = { amount: '', ref: '' };

    // Auto-fill amount for USD methods
    if (method?.currency === 'usd' && totalUsd > 0) {
      newSel[id].amount = totalUsd.toFixed(2);
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

  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    toast.show(ok ? `¡COPIADO: ${text}!` : 'ERROR AL COPIAR');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onProofChange(e.target.files?.[0] || null);
  };

  const activeDef = selectedMethod
    ? paymentMethods.find((p) => p.id === selectedMethod)
    : null;

  return (
    <div>
      {/* Method cards grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-5">
        {paymentMethods.map((opt) => {
          const Icon = iconMap[opt.icon] || CreditCard;
          const isActive = opt.id === selectedMethod;
          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={`
                bg-white border rounded-lg py-4 px-1 flex flex-col items-center justify-center
                h-[90px] transition-all duration-200
                ${isActive
                  ? 'border-alonzo-black border-[1.5px] bg-alonzo-gray-100 shadow-sm'
                  : 'border-alonzo-gray-300 hover:border-alonzo-gray-400'
                }
              `}
            >
              <Icon size={22} strokeWidth={1.5} className={isActive ? 'text-alonzo-black' : 'text-alonzo-gray-600'} />
              <span className="text-[9px] text-center uppercase font-semibold text-alonzo-charcoal mt-2">
                {opt.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Payment details panel */}
      {activeDef && (
        <div className="bg-alonzo-gray-100 border border-alonzo-gray-300 rounded-lg p-4 -mt-2.5 mb-5 animate-slide-down">
          <h4 className="text-xs uppercase font-medium mb-3 flex items-center gap-1.5">
            {(() => { const I = iconMap[activeDef.icon] || CreditCard; return <I size={14} />; })()}
            {activeDef.name}
          </h4>

          {/* Account info with copy buttons */}
          {Object.keys(activeDef.accountInfo).length > 0 && (
            <div className="bg-white border border-dashed border-alonzo-gray-400 rounded p-3 mb-3 space-y-1.5">
              {Object.entries(activeDef.accountInfo).map(([key, val]) => {
                const labels: Record<string, string> = {
                  bank: 'Banco', name: 'Nombre', phone: 'Teléfono',
                  ci: 'C.I./RIF', email: 'Email', user: 'Usuario',
                };
                return (
                  <div
                    key={key}
                    className="flex justify-between items-center pb-1 border-b border-dashed border-alonzo-gray-200 last:border-0 text-2xs text-alonzo-gray-600"
                  >
                    <span>
                      {labels[key] || key}:{' '}
                      <strong className="text-alonzo-black">{val}</strong>
                    </span>
                    <button
                      onClick={() => handleCopy(val)}
                      className="flex items-center gap-1 px-2 py-1 bg-alonzo-gray-300 rounded text-[9px] font-bold text-alonzo-charcoal"
                    >
                      <Copy size={10} /> COPIAR
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Amount & reference inputs */}
          <div className="flex gap-2.5 items-end">
            <div className="flex-1">
              <label className="label-luxury">
                MONTO ({activeDef.currency === 'usd' ? '$' : 'Bs.'})
              </label>
              <input
                type="number"
                className="input-luxury"
                placeholder="0.00"
                value={selection[activeDef.id]?.amount || ''}
                onChange={(e) => handleUpdate(activeDef.id, 'amount', e.target.value)}
              />
            </div>
            {activeDef.id !== 'efectivo_usd' && (
              <div className="flex-1">
                <label className="label-luxury">REFERENCIA (OPCIONAL)</label>
                <input
                  type="text"
                  className="input-luxury"
                  placeholder="Últimos 4 o 6 dígitos"
                  value={selection[activeDef.id]?.ref || ''}
                  onChange={(e) => handleUpdate(activeDef.id, 'ref', e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* File upload */}
      {selectedMethod && selectedMethod !== 'efectivo_usd' && (
        <div className="mb-5 animate-slide-down">
          <label
            htmlFor="proof-upload"
            className={`
              flex flex-col items-center justify-center w-full py-5 cursor-pointer
              transition-all duration-200 border-2 border-dashed
              ${proofFile
                ? 'bg-emerald-50 border-alonzo-success'
                : 'bg-alonzo-gray-200 border-alonzo-charcoal hover:bg-alonzo-gray-300'
              }
            `}
          >
            <Camera size={28} className={proofFile ? 'text-alonzo-success' : 'text-alonzo-charcoal'} />
            <span className="text-base font-bold uppercase tracking-wider mt-2">
              {proofFile ? '¡IMAGEN CARGADA!' : 'ADJUNTAR COMPROBANTE'}
            </span>
            {proofFile && (
              <span className="text-xs text-alonzo-success font-bold uppercase mt-1">
                {proofFile.name}
              </span>
            )}
          </label>
          <input
            type="file"
            id="proof-upload"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}
    </div>
  );
}

export type { PaymentSelection };

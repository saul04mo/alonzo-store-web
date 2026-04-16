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
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleSelect = (id: string) => {
    onMethodSelect(id);
    const method = paymentMethods.find((p) => p.id === id);
    const newSel: PaymentSelection = {};
    newSel[id] = { amount: '', ref: '' };
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
              className={`flex flex-col items-center justify-center gap-2 py-4 px-2 rounded-xl border transition-all duration-200 h-[85px] ${
                isActive
                  ? 'border-alonzo-black bg-gray-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <Icon size={20} strokeWidth={1.5} className={isActive ? 'text-alonzo-black' : 'text-gray-400'} />
              <span className={`text-[10px] text-center font-semibold leading-tight ${isActive ? 'text-alonzo-black' : 'text-gray-500'}`}>
                {opt.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* Payment details */}
      {activeDef && (
        <div className="bg-gray-50 rounded-xl p-5 space-y-4 page-fade-in">

          {/* Account info */}
          {Object.keys(activeDef.accountInfo).length > 0 && (
            <div className="space-y-0 rounded-lg overflow-hidden border border-gray-200">
              {Object.entries(activeDef.accountInfo).map(([key, val], idx, arr) => (
                <div
                  key={key}
                  className={`flex items-center justify-between px-4 py-3 bg-white ${
                    idx < arr.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">{labels[key] || key}</p>
                    <p className="text-sm font-semibold text-gray-900">{val}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(key, val)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all ${
                      copiedKey === key
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {copiedKey === key ? <Check size={11} /> : <Copy size={11} />}
                    {copiedKey === key ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Amount & reference */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                Monto ({activeDef.currency === 'usd' ? cs() : 'Bs.'})
              </label>
              <input
                type="number"
                inputMode="decimal"
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:border-alonzo-black focus:ring-1 focus:ring-alonzo-black outline-none transition-colors placeholder:text-gray-300"
                placeholder="0.00"
                value={selection[activeDef.id]?.amount || ''}
                onChange={(e) => handleUpdate(activeDef.id, 'amount', e.target.value)}
              />
            </div>
            {activeDef.id !== 'efectivo_usd' && (
              <div>
                <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">
                  Referencia
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:border-alonzo-black focus:ring-1 focus:ring-alonzo-black outline-none transition-colors placeholder:text-gray-300"
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
          className={`flex items-center justify-center gap-3 w-full py-4 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
            proofFile
              ? 'bg-emerald-50 border-emerald-400'
              : 'bg-white border-gray-300 hover:border-gray-400'
          }`}
        >
          {proofFile ? (
            <>
              <Check size={18} className="text-emerald-500" />
              <div className="text-center">
                <p className="text-xs font-semibold text-emerald-700">Comprobante cargado</p>
                <p className="text-[10px] text-emerald-500 mt-0.5">{proofFile.name}</p>
              </div>
            </>
          ) : (
            <>
              <Upload size={18} className="text-gray-400" />
              <div>
                <p className="text-xs font-semibold text-gray-600">Adjuntar comprobante</p>
                <p className="text-[10px] text-gray-400">Foto del pago o captura de pantalla</p>
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

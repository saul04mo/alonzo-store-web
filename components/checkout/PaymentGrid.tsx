'use client';
import { useEffect, useState } from 'react';
import {
  Smartphone, Building2, Banknote, Bitcoin, Wallet, CreditCard, Copy, Check, Upload, Image as ImageIcon,
} from 'lucide-react';
import { useToast } from '@/components/ui';
import { copyToClipboard } from '@/lib/format';
import { useMoney } from '@/lib/useMoney';
import type { PaymentMethod } from '@/types';

const iconMap: Record<string, typeof Smartphone> = {
  Smartphone, Building2, Banknote, Bitcoin, Wallet, CreditCard,
};

const CASH_ID = 'efectivo_usd';

// Orden en que un pago móvil pide los datos (banco → teléfono → cédula). El
// map de Firestore no garantiza orden, así que lo fijamos aquí.
const FIELD_ORDER = ['bank', 'phone', 'ci', 'name', 'email', 'user'];
const byFieldOrder = ([a]: [string, string], [b]: [string, string]) => {
  const ia = FIELD_ORDER.indexOf(a);
  const ib = FIELD_ORDER.indexOf(b);
  return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
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
  const { cs, formatUSD } = useMoney();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Efectivo: paga exacto o necesita vuelto. Con vuelto, el monto del pago es
  // lo que entrega (el servidor ya calcula el vuelto contra el total) y la
  // referencia lo deja escrito para quien lleva el pedido.
  const [cashMode, setCashMode] = useState<'exact' | 'change'>('exact');
  const [cashTendered, setCashTendered] = useState('');
  const tenderedNum = parseFloat(cashTendered) || 0;
  const cashChange = Math.max(0, tenderedNum - totalUsd);

  const applyCash = (mode: 'exact' | 'change', tendered: string) => {
    const t = parseFloat(tendered) || 0;
    onChange({
      [CASH_ID]:
        mode === 'exact'
          ? { amount: totalUsd.toFixed(2), ref: 'Monto exacto' }
          : {
              amount: tendered,
              ref: t > totalUsd
                ? `Paga con ${formatUSD(t)} — vuelto ${formatUSD(t - totalUsd)}`
                : 'Necesita vuelto',
            },
    });
  };

  // Si el total cambia (cupón, delivery) con el efectivo elegido, el monto
  // exacto y el vuelto lo siguen; si no, quedarían calculados con el viejo.
  useEffect(() => {
    if (selectedMethod === CASH_ID) applyCash(cashMode, cashTendered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalUsd]);

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
    if (id === CASH_ID) {
      setCashMode('exact');
      setCashTendered('');
      newSel[id].ref = 'Monto exacto';
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

  const labels: Record<string, string> = {
    bank: 'Banco', name: 'Nombre', phone: 'Teléfono',
    ci: 'C.I./RIF', email: 'Email', user: 'Usuario',
  };

  // Todos los datos de la cuenta + el monto en un solo texto, para pegarlo de
  // una vez (como en las apps de pago) en vez de copiar campo por campo.
  const copyAllText = (opt: PaymentMethod) => {
    const lines = Object.entries(opt.accountInfo)
      .sort(byFieldOrder)
      .map(([k, v]) => `${labels[k] || k}: ${v}`);
    const amount = parseFloat(selection[opt.id]?.amount || '');
    if (amount > 0) {
      lines.push(`Monto: ${opt.currency === 'ves' ? `Bs. ${amount.toFixed(2)}` : formatUSD(amount)}`);
    }
    return lines.join('\n');
  };

  const radioDot = (on: boolean) => (
    <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
      on ? 'border-alonzo-black' : 'border-alonzo-gray-400'
    }`}>
      {on && <span className="w-2.5 h-2.5 rounded-full bg-alonzo-black" />}
    </span>
  );

  const fieldClass =
    'w-full px-4 py-3 bg-white border border-alonzo-gray-300 rounded-sm text-sm font-medium text-alonzo-black focus:border-alonzo-black focus:ring-1 focus:ring-alonzo-black outline-none transition-colors placeholder:text-alonzo-gray-500';
  const labelClass =
    'block text-[10px] font-semibold text-alonzo-gray-600 uppercase tracking-wide mb-1.5';

  return (
    <div className="border border-alonzo-gray-300 rounded-sm divide-y divide-alonzo-gray-200 overflow-hidden">
      {paymentMethods.map((opt) => {
        const Icon = iconMap[opt.icon] || CreditCard;
        const isActive = opt.id === selectedMethod;
        const isCash = opt.id === CASH_ID;
        const hasAccount = Object.keys(opt.accountInfo).length > 0;
        const allKey = `all-${opt.id}`;
        return (
          <div key={opt.id}>
            {/* Fila del método — radio + nombre + logo */}
            <button
              type="button"
              onClick={() => handleSelect(opt.id)}
              aria-pressed={isActive}
              className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
                isActive ? 'bg-alonzo-gray-100' : 'bg-white hover:bg-alonzo-gray-100'
              }`}
            >
              {radioDot(isActive)}
              <span className={`flex-1 text-sm font-semibold ${isActive ? 'text-alonzo-black' : 'text-alonzo-charcoal'}`}>
                {opt.name}
              </span>
              <Icon size={20} strokeWidth={1.5} className="text-alonzo-gray-600 shrink-0" />
            </button>

            {/* Detalle expandido — solo el método seleccionado */}
            {isActive && (
              <div className="bg-alonzo-gray-100 px-4 pb-5 pt-1 space-y-4 page-fade-in">
                {/* Datos de la cuenta */}
                {hasAccount && (
                  <div className="rounded-sm overflow-hidden border border-alonzo-gray-300">
                    {Object.entries(opt.accountInfo).sort(byFieldOrder).map(([key, val], idx, arr) => (
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
                          type="button"
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

                {hasAccount && (
                  <button
                    type="button"
                    onClick={() => handleCopy(allKey, copyAllText(opt))}
                    className={`w-full flex items-center justify-center gap-2 py-3 rounded-sm border bg-white text-xs font-semibold uppercase tracking-wider transition-colors ${
                      copiedKey === allKey
                        ? 'border-alonzo-success text-alonzo-charcoal'
                        : 'border-alonzo-black text-alonzo-black hover:bg-alonzo-black hover:text-white'
                    }`}
                  >
                    {copiedKey === allKey ? <Check size={14} className="text-alonzo-success" /> : <Copy size={14} />}
                    {copiedKey === allKey ? 'Datos copiados' : 'Copiar todos los datos'}
                  </button>
                )}

                {/* Efectivo: monto exacto o con vuelto */}
                {isCash && (
                  <div className="space-y-2" role="radiogroup" aria-label="Pago en efectivo">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={cashMode === 'exact'}
                      onClick={() => { setCashMode('exact'); applyCash('exact', cashTendered); }}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-sm border bg-white text-left transition-colors ${
                        cashMode === 'exact' ? 'border-alonzo-black' : 'border-alonzo-gray-300 hover:border-alonzo-black'
                      }`}
                    >
                      {radioDot(cashMode === 'exact')}
                      <span className="flex-1 text-sm font-medium text-alonzo-black">Entregaré el monto exacto</span>
                      <span className="text-sm font-bold text-alonzo-black">{formatUSD(totalUsd)}</span>
                    </button>

                    <div
                      className={`rounded-sm border bg-white transition-colors ${
                        cashMode === 'change' ? 'border-alonzo-black' : 'border-alonzo-gray-300 hover:border-alonzo-black'
                      }`}
                    >
                      <button
                        type="button"
                        role="radio"
                        aria-checked={cashMode === 'change'}
                        onClick={() => { setCashMode('change'); applyCash('change', cashTendered); }}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                      >
                        {radioDot(cashMode === 'change')}
                        <span className="flex-1 text-sm font-medium text-alonzo-black">Necesito vuelto</span>
                      </button>
                      {cashMode === 'change' && (
                        <div className="grid grid-cols-2 gap-3 px-4 pb-4 page-fade-in">
                          <div>
                            <label htmlFor="cash-tendered" className={labelClass}>
                              Cantidad a entregar
                            </label>
                            <input
                              id="cash-tendered"
                              type="number"
                              inputMode="decimal"
                              autoFocus
                              className={fieldClass}
                              placeholder="100.00"
                              value={cashTendered}
                              onChange={(e) => { setCashTendered(e.target.value); applyCash('change', e.target.value); }}
                            />
                          </div>
                          <div>
                            <p className={labelClass}>Vuelto</p>
                            <p
                              className="px-4 py-3 bg-alonzo-gray-100 border border-alonzo-gray-300 rounded-sm text-sm font-bold text-alonzo-black"
                              aria-live="polite"
                            >
                              {formatUSD(cashChange)}
                            </p>
                          </div>
                          {tenderedNum > 0 && tenderedNum < totalUsd && (
                            <p className="col-span-2 text-xs text-red-600">
                              La cantidad a entregar debe ser mayor al total ({formatUSD(totalUsd)}).
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Monto y referencia (el efectivo usa las opciones de arriba) */}
                {!isCash && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`pago-monto-${opt.id}`} className={labelClass}>
                        Monto ({opt.currency === 'usd' ? cs() : 'Bs.'})
                        {/* En Bs se pierde la noción de cuánto es: el total en
                            divisa al lado, sin tener que bajar al resumen. */}
                        {opt.currency === 'ves' && totalUsd > 0 && (
                          <span className="ml-1.5 normal-case tracking-normal text-alonzo-black">
                            {formatUSD(totalUsd)}
                          </span>
                        )}
                      </label>
                      <input
                        id={`pago-monto-${opt.id}`}
                        type="number"
                        inputMode="decimal"
                        className={fieldClass}
                        placeholder="0.00"
                        value={selection[opt.id]?.amount || ''}
                        onChange={(e) => handleUpdate(opt.id, 'amount', e.target.value)}
                      />
                    </div>
                    <div>
                      <label htmlFor={`pago-ref-${opt.id}`} className={labelClass}>
                        Referencia
                      </label>
                      <input
                        id={`pago-ref-${opt.id}`}
                        type="text"
                        className={fieldClass}
                        placeholder="Últimos 4-6 dígitos"
                        value={selection[opt.id]?.ref || ''}
                        onChange={(e) => handleUpdate(opt.id, 'ref', e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Comprobante */}
                {!isCash && (
                  <label
                    htmlFor="proof-upload"
                    className={`flex items-center justify-center gap-3 w-full py-4 rounded-sm border-2 border-dashed cursor-pointer transition-all duration-200 ${
                      proofFile
                        ? 'bg-white border-alonzo-success'
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
            )}
          </div>
        );
      })}
    </div>
  );
}

export type { PaymentSelection };

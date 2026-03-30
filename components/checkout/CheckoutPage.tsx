'use client';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, ChevronDown, ChevronUp, Truck, CreditCard, CheckCircle2 } from 'lucide-react';
import { BottomSheet, useToast } from '@/components/ui';
import { useCartStore, useClientStore } from '@/stores';
import { useExchangeRate } from '@/lib/useExchangeRate';
import { deliveryMethods } from '@/config';
import { usePaymentMethods } from '@/lib/usePaymentMethods';
import { createOrder } from '@/lib/api';
import { PaymentGrid, type PaymentSelection } from './PaymentGrid';
import { formatUSD } from '@/lib/format';
import type { AddressResult } from './AddressPicker';
import dynamic from 'next/dynamic';

// FIX #27: Lazy-load AddressPicker (Leaflet CSS+JS) — only when delivery is selected
const AddressPicker = dynamic(
  () => import('./AddressPicker').then((mod) => mod.AddressPicker),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[280px] rounded-lg bg-gray-100 animate-pulse flex items-center justify-center">
        <p className="text-sm text-gray-400">Cargando mapa...</p>
      </div>
    ),
  }
);

/* ── Collapsible Section ────────────────────────────── */
function Section({
  number,
  title,
  summary,
  defaultOpen = false,
  children,
}: {
  number: number;
  title: string;
  summary?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 py-6">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left group"
      >
        <div className="flex items-center gap-4">
          <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium shrink-0">
            {number}
          </span>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {!open && summary && (
              <p className="text-sm text-gray-500 mt-0.5">{summary}</p>
            )}
          </div>
        </div>
        <span className="text-sm text-gray-500 group-hover:text-black transition-colors flex items-center gap-1">
          {open ? 'Cerrar' : 'Editar'}
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      <div
        className={`transition-all duration-300 ease-in-out ${
          open ? 'max-h-[2000px] opacity-100 mt-6 overflow-visible' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Checkout Page ──────────────────────────────────── */
interface CheckoutPageProps {
  onSuccess: (invoiceData: any, numericId: number, docId: string) => void;
}

export function CheckoutPage({ onSuccess }: CheckoutPageProps) {
  const router = useRouter();
  const toast = useToast();
  const exchangeRate = useExchangeRate();
  const { methods: paymentMethods } = usePaymentMethods();
  const { items, totalMoney, clear: clearCart } = useCartStore();
  const { client, setClient } = useClientStore();

  useEffect(() => { window.scrollTo(0, 0); }, []);

  // Form
  const [rif, setRif] = useState(client?.rif_ci || '');
  const [name, setName] = useState(client?.name || '');
  const [phone, setPhone] = useState(client?.phone || '');
  const [address, setAddress] = useState(client?.address || '');

  // Update when client profile loads or changes
  useEffect(() => {
    if (client) {
      if (!rif) setRif(client.rif_ci || '');
      if (!name) setName(client.name || '');
      if (!phone) setPhone(client.phone || '');
      if (!address) setAddress(client.address || '');
    }
  }, [client]);

  // Delivery
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery' | 'nacional'>('pickup');
  const [methodDropdownOpen, setMethodDropdownOpen] = useState(false);
  const [mapDeliveryCost, setMapDeliveryCost] = useState(0);
  const [mapDistanceKm, setMapDistanceKm] = useState<number | null>(null);

  // Payment
  const [paymentSelection, setPaymentSelection] = useState<PaymentSelection>({});
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);

  // UI
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');



  // Address from map
  const handleAddressSelect = (result: AddressResult) => {
    setAddress(result.address);
    setMapDeliveryCost(result.deliveryCost);
    setMapDistanceKm(result.distanceKm);
  };

  // Totals
  const deliveryCost = deliveryType === 'delivery' ? mapDeliveryCost : 0;
  const subtotal = totalMoney();
  const totalPaid = useMemo(() => {
    let paid = 0;
    Object.keys(paymentSelection).forEach((id) => {
      const val = parseFloat(paymentSelection[id].amount) || 0;
      const methodDef = paymentMethods.find((p) => p.id === id);
      if (methodDef && val > 0) {
        paid += methodDef.currency === 'ves' ? val / exchangeRate : val;
      }
    });
    return paid;
  }, [paymentSelection, exchangeRate]);

  const total = subtotal + deliveryCost;
  const canFinish = total - totalPaid <= 0.01;
  const deliveryMethodLabel = deliveryMethods.find((m) => m.id === deliveryType);

  const handleSubmit = async () => {
    setErrorMsg('');
    if (!rif || !name || !address) { setErrorMsg('Por favor completa nombre, RIF y dirección.'); return; }
    if (deliveryType === 'delivery' && mapDeliveryCost === 0) {
      setErrorMsg('Debes seleccionar tu ubicación en el mapa para calcular el costo de envío.');
      return;
    }
    const needsProof = Object.keys(paymentSelection).some((id) => {
      const val = parseFloat(paymentSelection[id].amount) || 0;
      return val > 0 && id !== 'efectivo_usd';
    });
    if (needsProof && !proofFile) { setErrorMsg('Debes subir el capture o foto del pago para finalizar.'); return; }

    setProcessing(true);
    try {
      const payments = Object.keys(paymentSelection)
        .filter((id) => parseFloat(paymentSelection[id].amount) > 0)
        .map((id) => {
          const data = paymentSelection[id];
          const val = parseFloat(data.amount) || 0;
          const methodDef = paymentMethods.find((p) => p.id === id)!;
          return {
            method: methodDef.name,
            amountUsd: methodDef.currency === 'ves' ? val / exchangeRate : val,
            amountVes: methodDef.currency === 'ves' ? val : val * exchangeRate,
            ref: data.ref || '',
          };
        });

      const result = await createOrder({
        cart: items,
        clientData: { name, rif_ci: rif, phone, address },
        deliveryType, deliveryCostUsd: deliveryCost,
        deliveryZoneInfo: mapDistanceKm !== null ? `Calculado mapa (${mapDistanceKm} km)` : 'No especificada',
        payments, exchangeRate, proofFile,
        authenticatedClientId: client?.id,
      });
      clearCart();
      onSuccess(result.invoiceData, result.numericId, result.docId);
      router.push('/');
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de conexión. Intenta de nuevo.');
    } finally { setProcessing(false); }
  };

  const inputClass =
    'w-full border border-gray-200 rounded-lg px-4 py-3.5 text-base outline-none transition-all focus:border-black focus:ring-1 focus:ring-black/5 placeholder:text-gray-400 bg-white';

  return (
    <div className="w-full max-w-[1400px] mx-auto px-5 md:px-10 py-8 font-sans min-h-[70vh]">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors mb-6"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
        </svg>
        Volver
      </button>

      {/* Two-column layout */}
      <div className="flex flex-col lg:flex-row gap-10 lg:gap-16">
        {/* ── LEFT: Checkout Steps ───────────────── */}
        <div className="flex-1 lg:max-w-[60%]">
          <h1 className="text-2xl font-semibold text-gray-900 mb-8">Finalizar compra</h1>

          {/* 1. Datos personales */}
          <Section
            number={1}
            title="Datos personales"
            summary={name || 'Completa tus datos'}
            defaultOpen={true}
          >
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-600 block mb-1.5">RIF / CI</label>
                <input type="text" className={inputClass} placeholder="V12345678" value={rif} onChange={(e) => setRif(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1.5">Nombre completo</label>
                  <input type="text" className={inputClass} placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600 block mb-1.5">Teléfono</label>
                  <input type="tel" className={inputClass} placeholder="0412..." value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </div>
            </div>
          </Section>

          {/* 2. Método de envío */}
          <Section
            number={2}
            title="Método de envío"
            summary={`${deliveryMethodLabel?.label} (${deliveryMethodLabel?.desc})`}
            defaultOpen={!address}
          >
            <div className="space-y-4">
              <div className="relative">
                <button
                  onClick={() => setMethodDropdownOpen(!methodDropdownOpen)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3.5 text-base flex justify-between items-center cursor-pointer hover:border-black transition-colors bg-white"
                >
                  <span>
                    {deliveryMethodLabel?.label}{' '}
                    <span className="text-sm text-gray-500">({deliveryMethodLabel?.desc})</span>
                  </span>
                  <ChevronDown size={18} className={`text-gray-400 transition-transform ${methodDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {methodDropdownOpen && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                    {deliveryMethods.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          setDeliveryType(m.id as any);
                          setMethodDropdownOpen(false);
                          if (m.id === 'pickup') {
                            setMapDeliveryCost(0);
                            setMapDistanceKm(null);
                          }
                        }}
                        className={`w-full text-left px-4 py-3.5 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 flex items-center justify-between ${
                          deliveryType === m.id ? 'bg-gray-50' : ''
                        }`}
                      >
                        <div>
                          <span className="font-medium text-gray-900">{m.label}</span>
                          <span className="text-gray-500 ml-2">{m.desc}</span>
                        </div>
                        {deliveryType === m.id && <CheckCircle2 size={16} className="text-black" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {deliveryMethodLabel && (
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-4 mt-2">
                  <Truck size={20} className="text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{deliveryMethodLabel.label}</p>
                    <p className="text-xs text-gray-500">{deliveryMethodLabel.desc}</p>
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* 3. Dirección de entrega (oculto si es pickup) */}
          {deliveryType !== 'pickup' && (
            <Section
              number={3}
              title="Dirección de entrega"
              summary={address ? address.substring(0, 60) + '...' : 'Busca tu dirección en el mapa'}
              defaultOpen={true}
            >
              <AddressPicker
                initialAddress={address}
                onAddressSelect={handleAddressSelect}
                showCostPricing={deliveryType === 'delivery'}
              />
            </Section>
          )}

          {/* 4. Pago */}
          <Section
            number={deliveryType === 'pickup' ? 3 : 4}
            title="Pago"
            summary="Selecciona tu método de pago"
          >
            <PaymentGrid
              paymentMethods={paymentMethods}
              selection={paymentSelection}
              onChange={setPaymentSelection}
              selectedMethod={selectedPaymentMethod}
              onMethodSelect={setSelectedPaymentMethod}
              totalUsd={total}
              proofFile={proofFile}
              onProofChange={setProofFile}
            />

            <button
              className="w-full py-4 mt-6 bg-black text-white text-base font-medium rounded-lg hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              disabled={!canFinish || processing}
              onClick={handleSubmit}
            >
              {processing ? 'Procesando...' : 'Confirmar método de pago'}
            </button>

            {errorMsg && (
              <div className="mt-4 text-sm font-medium text-red-600 bg-red-50 p-4 rounded-lg border border-red-200">
                {errorMsg}
              </div>
            )}
          </Section>
        </div>

        {/* ── RIGHT: Order Summary ──────────────── */}
        <div className="w-full lg:w-[38%]">
          <div className="lg:sticky lg:top-28">
            {/* Total bar */}
            <div className="flex items-center justify-between mb-2 pb-4 border-b border-gray-200">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-lg font-bold text-gray-900">USD {formatUSD(total)}</span>
            </div>

            <button
              className="w-full py-3.5 bg-gray-100 text-gray-500 text-sm font-medium rounded-lg mb-4 cursor-not-allowed"
              disabled
            >
              Realizar un pedido
            </button>

            <p className="text-xs text-gray-500 mb-8 leading-relaxed">
              Al realizar tu pedido, aceptas nuestros{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-black">Términos y Condiciones</a>{' '}
              y <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-black">Política de Privacidad</a>.
            </p>

            {/* Resumen heading */}
            <h3 className="text-lg font-semibold text-gray-900 mb-5">Resumen</h3>

            {/* Cart items */}
            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={item.key} className="flex gap-4">
                  <div className="w-16 h-20 bg-gray-100 rounded overflow-hidden shrink-0">
                    <img
                      src={item.img}
                      alt={item.titulo}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.titulo}</p>
                    {item.size && (
                      <p className="text-xs text-gray-500 mt-0.5">Talla: {item.size}</p>
                    )}
                    <p className="text-xs text-gray-500">Cant: {item.qty}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-900 shrink-0">
                    {formatUSD(parseFloat(item.precio) * item.qty)}
                  </p>
                </div>
              ))}
            </div>

            {/* Cost breakdown */}
            <div className="space-y-3 border-t border-gray-200 pt-4 mb-4">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Subtotal</span>
                <span>{formatUSD(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Envío</span>
                <span>{deliveryCost > 0 ? formatUSD(deliveryCost) : 'Gratis'}</span>
              </div>
            </div>

            <div className="flex justify-between text-base font-bold text-gray-900 border-t border-gray-200 pt-4 mb-6">
              <span>Total</span>
              <span>USD {formatUSD(total)}</span>
            </div>

            {/* Returns */}
          </div>
        </div>
      </div>
    </div>
  );
}

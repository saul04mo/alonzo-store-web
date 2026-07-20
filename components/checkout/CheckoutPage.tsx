'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { cs } from '@/lib/format';
import { displaySize } from '@/lib/sizes';
import { useRouter } from 'next/navigation';
import { MapPin, ChevronDown, Truck, CreditCard, CheckCircle2 } from 'lucide-react';
import { BottomSheet, useToast } from '@/components/ui';
import { useCartStore, useClientStore } from '@/stores';
import { useExchangeRate } from '@/lib/useExchangeRate';
import { deliveryMethods, shippingAgencies } from '@/config';
import { useShippingOffices } from '@/lib/useShippingOffices';
import { usePaymentMethods } from '@/lib/usePaymentMethods';
import { createOrder } from '@/lib/api';
import { trackPixel } from '@/lib/meta-pixel';
import {
  gaBeginCheckout,
  gaAddShippingInfo,
  gaAddPaymentInfo,
  gaPurchase,
} from '@/lib/analytics';
import { auth, signInAnonymously } from '@/lib/firebase-client';
import { PaymentGrid, type PaymentSelection } from './PaymentGrid';
import { formatUSD, formatBs } from '@/lib/format';
import { CouponInput, type AppliedCouponWeb } from './CouponInput';
import type { AddressResult } from './AddressPicker';
import dynamic from 'next/dynamic';

// FIX #27: Lazy-load AddressPicker (Leaflet CSS+JS) — only when delivery is selected
const AddressPicker = dynamic(
  () => import('./AddressPicker').then((mod) => mod.AddressPicker),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[280px] rounded-sm bg-alonzo-gray-200 animate-pulse flex items-center justify-center">
        <p className="text-sm text-alonzo-gray-600">Cargando mapa...</p>
      </div>
    ),
  }
);

/* ── Sección de formulario (siempre visible, un solo form) ───────────── */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-b border-alonzo-gray-300 py-7">
      <h2 className="text-xs font-semibold uppercase tracking-[0.15em] text-alonzo-black mb-5">
        {title}
      </h2>
      {children}
    </section>
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

  // Meta Pixel: inicio del checkout. Mide el abandono de carrito y permite
  // optimizar campañas hacia gente que sí empieza a comprar. Solo una vez al
  // montar, si hay ítems en el carrito.
  useEffect(() => {
    if (items.length === 0) return;
    trackPixel('InitiateCheckout', {
      content_ids: items.map((i) => i.productId),
      content_type: 'product',
      contents: items.map((i) => ({ id: i.productId, quantity: i.qty })),
      num_items: items.reduce((n, i) => n + i.qty, 0),
      value: totalMoney(),
      currency: 'USD',
    });
    // GA4 begin_checkout — el mismo momento del embudo, hacia Google Analytics.
    gaBeginCheckout(items, appliedCoupon?.code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Observa el ancla del botón de pago: cuando entra en viewport (descontando
  // la zona de la barra flotante), lo damos por "estacionado".
  useEffect(() => {
    const el = payAnchorRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setPayDocked(entry.isIntersecting),
      { rootMargin: '0px 0px -96px 0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [items.length]);

  // GA4 add_shipping_info / add_payment_info: se disparan cuando el cliente
  // ELIGE envío o pago, no al montar. Estos guards saltan el primer render
  // (donde deliveryType ya trae su valor por defecto "pickup").
  const shippingTrackedRef = useRef(false);
  const paymentTrackedRef = useRef<string | null>(null);

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
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'local' | 'national'>('pickup');
  const [methodDropdownOpen, setMethodDropdownOpen] = useState(false);
  const [mapDeliveryCost, setMapDeliveryCost] = useState(0);
  const [mapDistanceKm, setMapDistanceKm] = useState<number | null>(null);

  // Envío nacional por agencia (Zoom / MRW / Tealca / Otra). El flete lo cobra
  // la agencia a destino, así que aquí solo capturamos QUÉ agencia y A DÓNDE.
  const [agency, setAgency] = useState<string | null>(null);
  const [otherAgency, setOtherAgency] = useState('');
  const [agencyDestination, setAgencyDestination] = useState('');
  // Selección en cascada cuando la agencia tiene oficinas cargadas.
  const [officeState, setOfficeState] = useState('');
  const [officeCity, setOfficeCity] = useState('');
  const [officeName, setOfficeName] = useState('');

  // Oficinas de envío nacional (se descargan solo si el cliente elige nacional).
  const { agencies: officeAgencies, loading: officesLoading } =
    useShippingOffices(deliveryType === 'national');

  // Payment
  const [paymentSelection, setPaymentSelection] = useState<PaymentSelection>({});
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);

  // UI
  const [processing, setProcessing] = useState(false);
  const processingRef = useRef(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Errores por campo (validación inline) + refs para enfocar el primero
  const [fieldErrors, setFieldErrors] = useState<{ rif?: string; name?: string }>({});
  const rifRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  // Botón de pago "dinámico" en móvil: flota fijo abajo mientras se llena el
  // formulario y se estaciona en su sitio (el ancla al final del resumen)
  // cuando el usuario llega ahí. payDocked = true cuando el ancla está a la vista.
  const payAnchorRef = useRef<HTMLDivElement>(null);
  const [payDocked, setPayDocked] = useState(false);

  // Coupon
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponWeb | null>(null);

  // Address from map
  const handleAddressSelect = (result: AddressResult) => {
    setAddress(result.address);
    setMapDeliveryCost(result.deliveryCost);
    setMapDistanceKm(result.distanceKm);
  };

  // Totals
  const rawDeliveryCost = deliveryType === 'local' ? mapDeliveryCost : 0;
  const deliveryCost = appliedCoupon?.freeShipping ? 0 : rawDeliveryCost;
  const subtotal = totalMoney();

  // Calculate offer discounts desde el snapshot de cada ítem (el servidor
  // recalcula de forma autoritativa al crear la orden).
  const offerDiscount = useMemo(() => {
    let discount = 0;
    items.forEach((item) => {
      const offer = item.offer;
      if (offer && offer.value > 0) {
        const price = parseFloat(item.precio);
        const lineTotal = price * item.qty;
        if (offer.type === 'percentage') {
          discount += (lineTotal * offer.value) / 100;
        } else {
          discount += Math.min(offer.value * item.qty, lineTotal);
        }
      }
    });
    return Math.round(discount * 100) / 100;
  }, [items]);

  const couponDiscount = appliedCoupon?.discountAmount || 0;
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
  }, [paymentSelection, exchangeRate, paymentMethods]);

  const total = Math.max(0, subtotal - offerDiscount - couponDiscount + deliveryCost);
  const canFinish = total - totalPaid <= 0.01;
  const deliveryMethodLabel = deliveryMethods.find((m) => m.id === deliveryType);

  // Nombre legible de la agencia elegida (para orden, resumen y GA4).
  const agencyLabel =
    agency === 'otra'
      ? otherAgency.trim()
      : shippingAgencies.find((a) => a.id === agency)?.label ?? '';

  // ¿La agencia elegida tiene oficinas cargadas en Firestore? Si sí, usamos
  // los dropdowns en cascada; si no (agencia sin data aún, u "Otra"), caemos
  // al texto libre de destino.
  const officeAgency = officeAgencies.find(
    (a) => a.agency.toLowerCase() === agencyLabel.toLowerCase()
  );
  const officeStates = officeAgency?.states ?? [];
  const officeCities = officeStates.find((s) => s.state === officeState)?.cities ?? [];
  const officeList = officeCities.find((c) => c.city === officeCity)?.offices ?? [];
  const selectedOffice = officeList.find((o) => o.name === officeName);
  const usesOfficePicker = deliveryType === 'national' && !!officeAgency;

  // Al cambiar de agencia, reiniciamos la cascada estado/ciudad/oficina.
  useEffect(() => {
    setOfficeState('');
    setOfficeCity('');
    setOfficeName('');
  }, [agency]);

  // GA4 add_shipping_info — al cambiar método de envío o agencia (no al montar).
  // Para envío nacional el "tier" incluye la agencia (national · Zoom).
  useEffect(() => {
    if (!shippingTrackedRef.current) { shippingTrackedRef.current = true; return; }
    if (items.length === 0) return;
    const tier =
      deliveryType === 'national' && agencyLabel
        ? `national · ${agencyLabel}`
        : deliveryType;
    gaAddShippingInfo(items, tier, total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryType, agency]);

  // GA4 add_payment_info — la primera vez que se selecciona cada método.
  useEffect(() => {
    if (!selectedPaymentMethod || items.length === 0) return;
    if (paymentTrackedRef.current === selectedPaymentMethod) return;
    paymentTrackedRef.current = selectedPaymentMethod;
    gaAddPaymentInfo(items, selectedPaymentMethod, total);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPaymentMethod]);

  // Pista de lo que falta para poder pagar — se muestra bajo el botón para que
  // el cliente nunca vea un CTA "muerto" sin saber por qué.
  const paymentHint = canFinish
    ? null
    : !selectedPaymentMethod
      ? 'Selecciona tu método de pago para continuar.'
      : `Ingresa el monto del pago — faltan ${formatUSD(Math.max(0, total - totalPaid))} para cubrir el total.`;

  const handleSubmit = async () => {
    if (processingRef.current) return; // Ref guard — prevents double-click race condition
    setErrorMsg('');
    setFieldErrors({});

    // ── Validación de datos personales (errores inline por campo) ──
    const fe: { rif?: string; name?: string } = {};
    if (!rif) fe.rif = 'Ingresa tu RIF / CI.';
    if (!name) fe.name = 'Ingresa tu nombre completo.';
    if (fe.rif || fe.name) {
      setFieldErrors(fe);
      setErrorMsg('Revisa tus datos personales.');
      // Enfocamos (y desplazamos a) el primer campo con error.
      (fe.rif ? rifRef : nameRef).current?.focus();
      return;
    }
    // Delivery local: la dirección (del mapa) es obligatoria y define el costo.
    if (deliveryType === 'local' && !address) {
      setErrorMsg('Ingresa tu dirección de entrega.');
      return;
    }
    if (deliveryType === 'local' && mapDeliveryCost === 0) {
      setErrorMsg('Selecciona tu ubicación en el mapa para calcular el costo de envío.');
      return;
    }
    // Envío nacional: hay que elegir agencia (y decir cuál, si es "Otra") y a
    // dónde va la encomienda.
    if (deliveryType === 'national') {
      if (!agency) { setErrorMsg('Selecciona la agencia de envío.'); return; }
      if (agency === 'otra' && !otherAgency.trim()) {
        setErrorMsg('Indícanos el nombre de la agencia.');
        return;
      }
      if (usesOfficePicker) {
        // Agencia con oficinas cargadas: cascada estado → ciudad → oficina.
        if (!officeState) { setErrorMsg('Selecciona el estado de destino.'); return; }
        if (!officeCity) { setErrorMsg('Selecciona la ciudad de destino.'); return; }
        if (!selectedOffice) { setErrorMsg('Selecciona la oficina de destino.'); return; }
      } else if (!agencyDestination.trim()) {
        // Agencia sin oficinas cargadas (u "Otra"): destino en texto libre.
        setErrorMsg('Indica la ciudad y oficina/dirección de destino.');
        return;
      }
    }
    if (!selectedPaymentMethod) { setErrorMsg('Selecciona tu método de pago para continuar.'); return; }
    if (!canFinish) {
      const faltante = Math.max(0, total - totalPaid);
      setErrorMsg(`Ingresa el monto del pago. Faltan ${formatUSD(faltante)} por cubrir el total.`);
      return;
    }
    const needsProof = Object.keys(paymentSelection).some((id) => {
      const val = parseFloat(paymentSelection[id].amount) || 0;
      return val > 0 && id !== 'efectivo_usd';
    });
    if (needsProof && !proofFile) { setErrorMsg('Debes subir el capture o foto del pago para finalizar.'); return; }

    processingRef.current = true;
    setProcessing(true);
    try {
      // Checkout como invitado: si no hay sesión de Firebase, iniciamos una
      // sesión anónima para obtener un token válido. Esto deja intactas la
      // validación server-side de la orden, las reglas de Firestore y la
      // subida del comprobante (todas requieren auth), sin obligar al cliente
      // a crear una cuenta. Requiere tener habilitado el proveedor "Anonymous"
      // en Firebase Auth.
      if (!auth.currentUser) {
        try {
          await signInAnonymously(auth);
        } catch {
          setErrorMsg('No pudimos procesar tu pago como invitado. Intenta de nuevo o inicia sesión.');
          processingRef.current = false;
          setProcessing(false);
          return;
        }
      }

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

      // Info de envío según el método:
      //  - national: agencia elegida + destino (el flete lo cobra la agencia).
      //  - local: distancia calculada por el mapa.
      let deliveryZoneInfo = 'No especificada';
      let orderAddress = address;
      if (deliveryType === 'national') {
        if (usesOfficePicker && selectedOffice) {
          // Oficina elegida de la lista: guardamos todo el detalle.
          deliveryZoneInfo =
            `Agencia: ${agencyLabel} — ${officeState}, ${officeCity} — ` +
            `Oficina: ${selectedOffice.name}` +
            (selectedOffice.phone ? ` (Tel: ${selectedOffice.phone})` : '');
          orderAddress = `${selectedOffice.name} — ${selectedOffice.address}, ${officeCity}, ${officeState}`;
        } else {
          // Destino en texto libre (agencia sin oficinas cargadas u "Otra").
          deliveryZoneInfo = `Agencia: ${agencyLabel} — ${agencyDestination.trim()}`;
          orderAddress = agencyDestination.trim();
        }
      } else if (deliveryType === 'local' && mapDistanceKm !== null) {
        deliveryZoneInfo = `Calculado mapa (${mapDistanceKm} km)`;
      }

      const result = await createOrder({
        cart: items,
        clientData: { name, rif_ci: rif, phone, address: orderAddress },
        deliveryType, deliveryCostUsd: deliveryCost,
        deliveryZoneInfo,
        payments, exchangeRate, proofFile,
        authenticatedClientId: client?.id,
        couponCode: appliedCoupon?.code || undefined,
      });
      // Meta Pixel: la conversión. Es el evento MÁS importante — con él Meta
      // optimiza las campañas y calcula el ROAS. Va antes de limpiar el carrito
      // para tener los ítems a mano.
      trackPixel('Purchase', {
        content_ids: items.map((i) => i.productId),
        content_type: 'product',
        contents: items.map((i) => ({ id: i.productId, quantity: i.qty })),
        num_items: items.reduce((n, i) => n + i.qty, 0),
        value: result.invoiceData.total,
        currency: 'USD',
      });
      // GA4 purchase — LA conversión. transaction_id = id de la orden para que
      // GA no cuente dos veces si el usuario recarga la pantalla de éxito.
      // Va antes de clearCart() para tener los ítems a mano.
      gaPurchase(items, {
        transaction_id: String(result.numericId),
        value: result.invoiceData.total,
        shipping: deliveryCost,
        coupon: appliedCoupon?.code,
      });

      clearCart();
      onSuccess(result.invoiceData, result.numericId, result.docId);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de conexión. Intenta de nuevo.');
    } finally { processingRef.current = false; setProcessing(false); }
  };

  const inputClass =
    'w-full border border-alonzo-gray-300 rounded-sm px-4 py-3.5 text-base outline-none transition-all focus:border-alonzo-black focus:ring-1 focus:ring-alonzo-black/5 placeholder:text-alonzo-gray-500 bg-white';

  return (
    <>
    <div className="w-full max-w-[1400px] mx-auto px-5 md:px-10 py-8 font-sans min-h-[70vh] page-fade-in">
      {/* Back */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-alonzo-gray-600 hover:text-alonzo-black transition-colors mb-6"
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
          <h1 className="text-2xl font-semibold text-alonzo-black mb-8">Finalizar compra</h1>

          {/* Datos personales */}
          <Section title="Datos personales">
            <div className="space-y-5">
              <div>
                <label htmlFor="checkout-rif" className="text-sm font-medium text-alonzo-gray-600 block mb-1.5">RIF / CI</label>
                <input
                  id="checkout-rif"
                  ref={rifRef}
                  type="text"
                  aria-invalid={!!fieldErrors.rif}
                  aria-describedby={fieldErrors.rif ? 'error-rif' : undefined}
                  className={`${inputClass} ${client?.rif_ci ? 'bg-alonzo-gray-100 text-alonzo-gray-600 cursor-not-allowed' : ''} ${fieldErrors.rif ? '!border-red-500' : ''}`}
                  placeholder="V12345678"
                  value={rif}
                  onChange={(e) => { setRif(e.target.value); if (fieldErrors.rif) setFieldErrors((f) => ({ ...f, rif: undefined })); }}
                  disabled={!!client?.rif_ci}
                />
                {fieldErrors.rif && <p id="error-rif" className="text-xs text-red-600 mt-1.5">{fieldErrors.rif}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="checkout-nombre" className="text-sm font-medium text-alonzo-gray-600 block mb-1.5">Nombre completo</label>
                  <input
                    id="checkout-nombre"
                    ref={nameRef}
                    type="text"
                    aria-invalid={!!fieldErrors.name}
                    aria-describedby={fieldErrors.name ? 'error-nombre' : undefined}
                    className={`${inputClass} ${client?.name ? 'bg-alonzo-gray-100 text-alonzo-gray-600 cursor-not-allowed' : ''} ${fieldErrors.name ? '!border-red-500' : ''}`}
                    placeholder="Tu nombre"
                    value={name}
                    onChange={(e) => { setName(e.target.value); if (fieldErrors.name) setFieldErrors((f) => ({ ...f, name: undefined })); }}
                    disabled={!!client?.name}
                  />
                  {fieldErrors.name && <p id="error-nombre" className="text-xs text-red-600 mt-1.5">{fieldErrors.name}</p>}
                </div>
                <div>
                  <label htmlFor="checkout-telefono" className="text-sm font-medium text-alonzo-gray-600 block mb-1.5">Teléfono</label>
                  <input id="checkout-telefono" type="tel" className={`${inputClass} ${client?.phone ? 'bg-alonzo-gray-100 text-alonzo-gray-600 cursor-not-allowed' : ''}`} placeholder="0412..." value={phone} onChange={(e) => setPhone(e.target.value)} disabled={!!client?.phone} />
                </div>
              </div>
              {client && (
                <p className="text-xs text-alonzo-gray-600 flex items-center gap-1.5">
                  <CheckCircle2 size={12} className="text-alonzo-success" />
                  Datos vinculados a tu cuenta. Para modificarlos ve a <button onClick={() => router.push('/account/details')} className="underline hover:text-alonzo-black transition-colors">Mi Cuenta</button>.
                </p>
              )}
            </div>
          </Section>

          {/* Método de envío */}
          <Section title="Método de envío">
            <div className="space-y-4">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMethodDropdownOpen(!methodDropdownOpen)}
                  aria-haspopup="listbox"
                  aria-expanded={methodDropdownOpen}
                  aria-label="Método de envío"
                  className="w-full border border-alonzo-gray-300 rounded-sm px-4 py-3.5 text-base flex justify-between items-center cursor-pointer hover:border-alonzo-black transition-colors bg-white"
                >
                  <span>
                    {deliveryMethodLabel?.label}{' '}
                    <span className="text-sm text-alonzo-gray-600">({deliveryMethodLabel?.desc})</span>
                  </span>
                  <ChevronDown size={18} className={`text-alonzo-gray-600 transition-transform ${methodDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {methodDropdownOpen && (
                  <div className="absolute z-10 top-full left-0 right-0 mt-2 bg-white border border-alonzo-gray-300 rounded-sm shadow-lg overflow-hidden">
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
                        className={`w-full text-left px-4 py-3.5 text-sm hover:bg-alonzo-gray-100 transition-colors border-b border-alonzo-gray-200 last:border-0 flex items-center justify-between ${
                          deliveryType === m.id ? 'bg-alonzo-gray-100' : ''
                        }`}
                      >
                        <div>
                          <span className="font-medium text-alonzo-black">{m.label}</span>
                          <span className="text-alonzo-gray-600 ml-2">{m.desc}</span>
                        </div>
                        {deliveryType === m.id && <CheckCircle2 size={16} className="text-alonzo-black" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {deliveryMethodLabel && (
                <div className="flex items-center gap-3 bg-alonzo-gray-100 rounded-sm p-4 mt-2">
                  <Truck size={20} className="text-alonzo-gray-600" />
                  <div>
                    <p className="text-sm font-medium text-alonzo-charcoal">{deliveryMethodLabel.label}</p>
                    <p className="text-xs text-alonzo-gray-600">{deliveryMethodLabel.desc}</p>
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Delivery local: dirección por mapa (calcula el costo). */}
          {deliveryType === 'local' && (
            <Section title="Dirección de entrega">
              <AddressPicker
                initialAddress={address}
                onAddressSelect={handleAddressSelect}
                showCostPricing={true}
              />
            </Section>
          )}

          {/* Envío nacional: elección de agencia + destino (el flete lo cobra
              la agencia a destino, por eso NO usamos el mapa aquí). */}
          {deliveryType === 'national' && (
            <Section title="Agencia de envío">
              <p className="text-sm text-alonzo-gray-600 mb-4">
                Elige tu agencia. El costo del envío lo pagas al retirar en la
                oficina de destino.
              </p>
              <div className="grid grid-cols-2 gap-3">
                {shippingAgencies.map((a) => {
                  const selected = agency === a.id;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => setAgency(a.id)}
                      aria-pressed={selected}
                      className={`text-left rounded-sm border p-4 transition-colors ${
                        selected
                          ? 'border-alonzo-black bg-alonzo-gray-100'
                          : 'border-alonzo-gray-300 hover:border-alonzo-black bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-alonzo-black">{a.label}</span>
                        {selected && <CheckCircle2 size={16} className="text-alonzo-black shrink-0" />}
                      </div>
                      <span className="text-xs text-alonzo-gray-600">{a.desc}</span>
                    </button>
                  );
                })}
              </div>

              {/* Nombre de la agencia cuando eligió "Otra". */}
              {agency === 'otra' && (
                <div className="mt-4">
                  <label htmlFor="agency-other" className="text-sm font-medium text-alonzo-gray-600 block mb-1.5">
                    ¿Cuál agencia?
                  </label>
                  <input
                    id="agency-other"
                    type="text"
                    className={inputClass}
                    placeholder="Nombre de la agencia"
                    value={otherAgency}
                    onChange={(e) => setOtherAgency(e.target.value)}
                  />
                </div>
              )}

              {/* Cargando oficinas de la agencia elegida. */}
              {agency && agency !== 'otra' && officesLoading && !officeAgency && (
                <p className="mt-4 text-sm text-alonzo-gray-600">Cargando oficinas…</p>
              )}

              {/* Cascada estado → ciudad → oficina (agencias con data cargada). */}
              {usesOfficePicker && (
                <div className="mt-4 space-y-4">
                  {/* Estado */}
                  <div>
                    <label htmlFor="office-state" className="text-sm font-medium text-alonzo-gray-600 block mb-1.5">
                      Estado
                    </label>
                    <select
                      id="office-state"
                      className={inputClass}
                      value={officeState}
                      onChange={(e) => { setOfficeState(e.target.value); setOfficeCity(''); setOfficeName(''); }}
                    >
                      <option value="">Selecciona tu estado</option>
                      {officeStates.map((s) => (
                        <option key={s.state} value={s.state}>{s.state}</option>
                      ))}
                    </select>
                  </div>

                  {/* Ciudad */}
                  {officeState && (
                    <div>
                      <label htmlFor="office-city" className="text-sm font-medium text-alonzo-gray-600 block mb-1.5">
                        Ciudad
                      </label>
                      <select
                        id="office-city"
                        className={inputClass}
                        value={officeCity}
                        onChange={(e) => { setOfficeCity(e.target.value); setOfficeName(''); }}
                      >
                        <option value="">Selecciona tu ciudad</option>
                        {officeCities.map((c) => (
                          <option key={c.city} value={c.city}>{c.city}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Oficina */}
                  {officeCity && (
                    <div>
                      <label htmlFor="office-name" className="text-sm font-medium text-alonzo-gray-600 block mb-1.5">
                        Oficina
                      </label>
                      <select
                        id="office-name"
                        className={inputClass}
                        value={officeName}
                        onChange={(e) => setOfficeName(e.target.value)}
                      >
                        <option value="">Selecciona la oficina</option>
                        {officeList.map((o) => (
                          <option key={o.name} value={o.name}>{o.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Detalle de la oficina elegida. */}
                  {selectedOffice && (
                    <div className="flex items-start gap-3 bg-alonzo-gray-100 rounded-sm p-4">
                      <MapPin size={18} className="text-alonzo-gray-600 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-alonzo-black">{selectedOffice.name}</p>
                        {selectedOffice.address && (
                          <p className="text-alonzo-gray-600">{selectedOffice.address}</p>
                        )}
                        {selectedOffice.phone && (
                          <p className="text-alonzo-gray-600">Tel: {selectedOffice.phone}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Destino en texto libre: agencia sin oficinas cargadas u "Otra". */}
              {agency && !usesOfficePicker && !(agency !== 'otra' && officesLoading) && (
                <div className="mt-4">
                  <label htmlFor="agency-destination" className="text-sm font-medium text-alonzo-gray-600 block mb-1.5">
                    Ciudad y oficina / dirección de destino
                  </label>
                  <textarea
                    id="agency-destination"
                    rows={3}
                    className={`${inputClass} resize-none`}
                    placeholder="Ej: Valencia, Edo. Carabobo — oficina Av. Bolívar Norte / dirección exacta"
                    value={agencyDestination}
                    onChange={(e) => setAgencyDestination(e.target.value)}
                  />
                </div>
              )}
            </Section>
          )}

          {/* Cupón de descuento */}
          <Section title="Cupón de descuento">
            <CouponInput
              subtotal={subtotal}
              appliedCoupon={appliedCoupon}
              onApply={setAppliedCoupon}
              onRemove={() => setAppliedCoupon(null)}
            />
          </Section>

          {/* Pago */}
          <Section title="Pago">
            <PaymentGrid
              paymentMethods={paymentMethods}
              selection={paymentSelection}
              onChange={setPaymentSelection}
              selectedMethod={selectedPaymentMethod}
              onMethodSelect={setSelectedPaymentMethod}
              totalUsd={total}
              exchangeRate={exchangeRate}
              proofFile={proofFile}
              onProofChange={setProofFile}
            />

            {/* CTA in-section — desktop: el resumen con Total ya está visible y
                fijo a la derecha. En móvil usamos la barra fija de abajo. */}
            <div className="hidden lg:block">
              <button
                className="w-full py-4 mt-6 bg-alonzo-black text-white text-sm font-medium uppercase tracking-wider rounded-none hover:bg-alonzo-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={processing}
                onClick={handleSubmit}
              >
                {processing ? 'Procesando...' : 'Confirmar pago'}
              </button>

              {/* Pista de lo que falta — sin gritar (gris), solo cuando aún no se
                  puede pagar y no hay un error explícito que mostrar. */}
              {paymentHint && !errorMsg && (
                <p className="mt-3 text-sm text-alonzo-gray-600 text-center">{paymentHint}</p>
              )}

              {errorMsg && (
                <div className="mt-4 text-sm font-medium text-red-600 bg-red-50 p-4 rounded-sm border border-red-200">
                  {errorMsg}
                </div>
              )}
            </div>
          </Section>
        </div>

        {/* ── RIGHT: Order Summary ──────────────── */}
        <div className="w-full lg:w-[38%]">
          <div className="lg:sticky lg:top-28">

            {/* Resumen heading */}
            <h3 className="text-lg font-semibold text-alonzo-black mb-5">Resumen</h3>

            {/* Cart items */}
            <div className="space-y-4 mb-6">
              {items.map((item) => {
                const offer = item.offer;
                const hasOffer = offer && offer.value > 0;
                const originalTotal = parseFloat(item.precio) * item.qty;
                const discountedTotal = hasOffer
                  ? (offer!.type === 'percentage'
                      ? originalTotal - (originalTotal * offer!.value / 100)
                      : Math.max(0, originalTotal - offer!.value * item.qty))
                  : originalTotal;

                return (
                  <div key={item.key} className="flex gap-4">
                    <div className="w-16 h-20 bg-alonzo-gray-200 rounded-sm overflow-hidden shrink-0 relative">
                      <img
                        src={item.img}
                        alt={item.titulo}
                        className="w-full h-full object-cover"
                      />
                      {hasOffer && (
                        <div className="absolute top-1 left-1 bg-red-600 text-white text-[7px] font-bold px-1 py-0.5 rounded-sm">
                          {offer!.type === 'percentage' ? `-${offer!.value}%` : `-${cs()}${offer!.value}`}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-alonzo-black truncate">{item.titulo}</p>
                      {item.size && (
                        <p className="text-xs text-alonzo-gray-600 mt-0.5">Talla: {displaySize(item.size)}</p>
                      )}
                      <p className="text-xs text-alonzo-gray-600">Cant: {item.qty}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      {hasOffer ? (
                        <>
                          <p className="text-sm font-medium text-red-600">{formatUSD(discountedTotal)}</p>
                          <p className="text-[10px] text-alonzo-gray-600 line-through">{formatUSD(originalTotal)}</p>
                        </>
                      ) : (
                        <p className="text-sm font-medium text-alonzo-black">{formatUSD(originalTotal)}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Cost breakdown */}
            <div className="space-y-3 border-t border-alonzo-gray-300 pt-4 mb-4">
              <div className="flex justify-between text-sm text-alonzo-gray-600">
                <span>Subtotal</span>
                <span>{formatUSD(subtotal)}</span>
              </div>
              {offerDiscount > 0 && (
                <div className="flex justify-between text-sm text-red-600 font-medium">
                  <span>Ofertas</span>
                  <span>- {formatUSD(offerDiscount)}</span>
                </div>
              )}
              {couponDiscount > 0 && (
                <div className="flex justify-between text-sm text-alonzo-charcoal font-medium">
                  <span>Cupón {appliedCoupon?.code}</span>
                  <span>- {formatUSD(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm text-alonzo-gray-600">
                <span>Envío</span>
                {appliedCoupon?.freeShipping && rawDeliveryCost > 0 ? (
                  <span className="text-alonzo-charcoal font-medium">Gratis 🎉</span>
                ) : (
                  <span>{deliveryCost > 0 ? formatUSD(deliveryCost) : 'Gratis'}</span>
                )}
              </div>
            </div>

            <div className="flex justify-between text-base font-bold text-alonzo-black border-t border-alonzo-gray-300 pt-4 mb-1">
              <span>Total</span>
              <span>{formatUSD(total)}</span>
            </div>
            {exchangeRate > 0 && (
              <div className="flex justify-between text-sm text-alonzo-gray-600 mb-4">
                <span>Ref. en Bs</span>
                <span className="font-medium">{formatBs(total * exchangeRate)}</span>
              </div>
            )}
            {!exchangeRate && <div className="mb-4" />}

            <p className="text-xs text-alonzo-gray-600 mb-4 leading-relaxed text-center">
              Al realizar tu pedido, aceptas nuestros{' '}
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-alonzo-black">Términos y Condiciones</a>{' '}
              y <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-alonzo-black">Política de Privacidad</a>.
            </p>

            {/* Ancla del botón en móvil: cuando se ve, la barra flotante se
                "estaciona" aquí (deja de flotar). */}
            <div ref={payAnchorRef} className="lg:hidden">
              {errorMsg ? (
                <p className="text-xs font-medium text-red-600 mb-2 text-center">{errorMsg}</p>
              ) : paymentHint ? (
                <p className="text-xs text-alonzo-gray-600 mb-2 text-center">{paymentHint}</p>
              ) : null}
              <button
                className="w-full py-4 bg-alonzo-black text-white text-sm font-medium uppercase tracking-wider rounded-none active:bg-alonzo-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                disabled={processing}
                onClick={handleSubmit}
              >
                {processing ? 'Procesando...' : 'Confirmar pago'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Espaciador para que la barra fija móvil no tape el contenido final */}
    <div className="h-24 lg:hidden" aria-hidden="true" />

    {/* ── Barra de checkout flotante (solo móvil) ──────────────
        Total + CTA flotando abajo MIENTRAS no se llega al botón final.
        Cuando el ancla entra en viewport (payDocked), se oculta y el botón
        estático del resumen toma el relevo. */}
    {!payDocked && (
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-alonzo-gray-300 px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        {errorMsg ? (
          <p className="text-xs font-medium text-red-600 mb-2 text-center">{errorMsg}</p>
        ) : paymentHint ? (
          <p className="text-xs text-alonzo-gray-600 mb-2 text-center">{paymentHint}</p>
        ) : null}
        <div className="flex items-center gap-4">
          <div className="shrink-0">
            <p className="text-[10px] text-alonzo-gray-600 uppercase tracking-wide leading-tight">Total</p>
            <p className="text-lg font-bold text-alonzo-black leading-tight">{formatUSD(total)}</p>
            {exchangeRate > 0 && (
              <p className="text-[10px] text-alonzo-gray-600 leading-tight">{formatBs(total * exchangeRate)}</p>
            )}
          </div>
          <button
            className="flex-1 py-3.5 bg-alonzo-black text-white text-sm font-medium uppercase tracking-wider rounded-none active:bg-alonzo-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={processing}
            onClick={handleSubmit}
          >
            {processing ? 'Procesando...' : 'Confirmar pago'}
          </button>
        </div>
      </div>
    )}
    </>
  );
}

'use client';
import { useState, useCallback, useMemo, useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { Modal, ModalHeader, BottomSheet, useToast } from '@/components/ui';
import { useCartStore, useClientStore, useConfigStore } from '@/stores';
import { useExchangeRate } from '@/lib/useExchangeRate';
import { deliveryZones, deliveryMethods } from '@/config';
import { usePaymentMethods } from '@/lib/usePaymentMethods';
import { createOrder } from '@/lib/api';
import { PaymentGrid, type PaymentSelection } from './PaymentGrid';
import { OrderSummary } from './OrderSummary';
import { CouponInput, type AppliedCouponWeb } from './CouponInput';

interface CheckoutViewProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (invoiceData: any, numericId: number, docId: string) => void;
}

export function CheckoutView({ open, onClose, onSuccess }: CheckoutViewProps) {
  const toast = useToast();
  const exchangeRate = useExchangeRate();
  const { methods: paymentMethods } = usePaymentMethods();
  const { items, totalMoney, clear: clearCart } = useCartStore();
  const { client, setClient } = useClientStore();

  // Form state
  const [rif, setRif] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Delivery
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery' | 'nacional'>('pickup');
  const [selectedZone, setSelectedZone] = useState<{ name: string; price: number } | null>(null);
  const [zoneSheetOpen, setZoneSheetOpen] = useState(false);
  const [methodSheetOpen, setMethodSheetOpen] = useState(false);

  // Payments
  const [paymentSelection, setPaymentSelection] = useState<PaymentSelection>({});
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);

  // UI
  const [processing, setProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Coupon
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponWeb | null>(null);

  // Pre-fill from client store
  useEffect(() => {
    if (open && client) {
      setRif(client.rif_ci || '');
      setName(client.name || '');
      setPhone(client.phone || '');
      setAddress(client.address || '');
    }
  }, [open, client]);


  // Calculate totals
  const rawDeliveryCost = deliveryType === 'delivery' ? (selectedZone?.price || 0) : 0;
  const deliveryCost = appliedCoupon?.freeShipping ? 0 : rawDeliveryCost;
  const subtotal = totalMoney();
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
  }, [paymentSelection, exchangeRate]);

  const total = Math.max(0, subtotal - couponDiscount + deliveryCost);
  const canFinish = total - totalPaid <= 0.01;

  // Delivery method label
  const deliveryMethodLabel = deliveryMethods.find((m) => m.id === deliveryType);

  // Submit order
  const handleSubmit = async () => {
    setErrorMsg('');

    if (!rif || !name || !address) {
      setErrorMsg('⚠️ FALTAN DATOS: POR FAVOR LLENA NOMBRE, RIF Y DIRECCIÓN.');
      return;
    }

    const needsProof = Object.keys(paymentSelection).some((id) => {
      const val = parseFloat(paymentSelection[id].amount) || 0;
      return val > 0 && id !== 'efectivo_usd';
    });

    if (needsProof && !proofFile) {
      setErrorMsg('⚠️ ¡ATENCIÓN! DEBES SUBIR EL CAPTURE/FOTO DEL PAGO PARA PODER FINALIZAR.');
      return;
    }

    setProcessing(true);

    try {
      // Build payments array
      const payments = Object.keys(paymentSelection)
        .filter((id) => parseFloat(paymentSelection[id].amount) > 0)
        .map((id) => {
          const data = paymentSelection[id];
          const val = parseFloat(data.amount) || 0;
          const methodDef = paymentMethods.find((p) => p.id === id)!;
          const amountUsd = methodDef.currency === 'ves' ? val / exchangeRate : val;
          const amountVes = methodDef.currency === 'ves' ? val : val * exchangeRate;
          return {
            method: methodDef.name,
            amountUsd,
            amountVes,
            ref: data.ref || '',
          };
        });

      const result = await createOrder({
        cart: items,
        clientData: { name, rif_ci: rif, phone, address },
        deliveryType,
        deliveryCostUsd: deliveryCost,
        deliveryZoneInfo: selectedZone?.name || '',
        payments,
        exchangeRate,
        proofFile,
        couponCode: appliedCoupon?.code || undefined,
      });

      clearCart();
      onSuccess(result.invoiceData, result.numericId, result.docId);
    } catch (err) {
      console.error('Error al finalizar pedido:', err);
      setErrorMsg('ERROR DE CONEXIÓN. INTENTA DE NUEVO.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <Modal open={open} onClose={onClose} zIndex={5000}>
        <ModalHeader title="RESUMEN DE COMPRA" onClose={onClose} variant="back" />

        <div className="flex-1 overflow-y-auto px-6 pb-10">
          <p className="text-2xs text-alonzo-gray-500 text-center uppercase tracking-wider mb-6">
            Verifica tus datos y pago antes de finalizar
          </p>

          {/* Client form */}
          <div className="space-y-5 mb-6">
            <div>
              <label className="label-luxury">RIF / CI</label>
              <input
                type="text"
                className="input-luxury"
                placeholder="V12345678"
                value={rif}
                onChange={(e) => setRif(e.target.value)}
              />
            </div>
            <div>
              <label className="label-luxury">NOMBRE</label>
              <input
                type="text"
                className="input-luxury"
                placeholder="Tu nombre"
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
          </div>

          <div className="h-px bg-alonzo-gray-300 my-5" />

          {/* Address */}
          <div className="bg-alonzo-gray-100 border-l-[3px] border-alonzo-black p-4 mb-6">
            <div className="flex items-center gap-1.5 text-2xs font-bold text-alonzo-black mb-2.5">
              <MapPin size={12} /> DIRECCIÓN DE ENTREGA
            </div>
            <textarea
              className="w-full bg-transparent border-0 text-base uppercase outline-none text-alonzo-charcoal resize-none"
              rows={2}
              placeholder="CONFIRMA TU DIRECCIÓN AQUÍ..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>

          {/* Delivery method selector */}
          <div className="mb-5">
            <label className="label-luxury">MÉTODO DE ENVÍO</label>
            <button
              onClick={() => setMethodSheetOpen(true)}
              className="input-luxury flex justify-between items-center cursor-pointer"
            >
              <span>{deliveryMethodLabel?.label} ({deliveryMethodLabel?.desc})</span>
              <ChevronDown size={14} />
            </button>
          </div>

          {/* Zone selector (only for delivery) */}
          {deliveryType === 'delivery' && (
            <div className="mb-5">
              <label className="label-luxury">ZONA DE ENTREGA</label>
              <button
                onClick={() => setZoneSheetOpen(true)}
                className="input-luxury flex justify-between items-center cursor-pointer"
              >
                <span className={selectedZone ? 'text-alonzo-black' : 'text-alonzo-gray-500 italic'}>
                  {selectedZone?.name || 'SELECCIONAR ZONA...'}
                </span>
                <ChevronDown size={14} />
              </button>
              <p className="text-[9px] text-alonzo-gray-500 mt-1">
                *El costo se sumará al total automáticamente.
              </p>
            </div>
          )}

          <div className="h-px bg-alonzo-gray-300 my-5" />

          {/* Coupon */}
          <div className="mb-5">
            <CouponInput
              subtotal={subtotal}
              appliedCoupon={appliedCoupon}
              onApply={setAppliedCoupon}
              onRemove={() => setAppliedCoupon(null)}
            />
          </div>

          <div className="h-px bg-alonzo-gray-300 my-5" />

          {/* Payment */}
          <label className="label-luxury mb-3 block">MÉTODO DE PAGO</label>
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

          {/* Order summary */}
          <OrderSummary
            subtotal={subtotal}
            discount={couponDiscount}
            deliveryCost={deliveryCost}
            totalPaid={totalPaid}
            exchangeRate={exchangeRate}
            couponCode={appliedCoupon?.code}
            freeShipping={appliedCoupon?.freeShipping}
            originalDeliveryCost={rawDeliveryCost}
          />

          {/* Submit button */}
          <button
            className="btn-primary mt-6"
            disabled={!canFinish || processing}
            onClick={handleSubmit}
          >
            {processing ? 'PROCESANDO...' : 'FINALIZAR PEDIDO'}
          </button>

          {/* Error message */}
          {errorMsg && (
            <div className="mt-3 text-center text-xs font-bold text-red-700 bg-red-50 p-3 rounded border border-red-400 uppercase">
              {errorMsg}
            </div>
          )}
        </div>
      </Modal>

      {/* Zone selection sheet */}
      <BottomSheet
        open={zoneSheetOpen}
        onClose={() => setZoneSheetOpen(false)}
        title="SELECCIONA TU ZONA"
        maxHeight="70vh"
      >
        {deliveryZones.map((group, gi) => (
          <div key={gi}>
            <div className="bg-alonzo-gray-200 px-3 py-2 text-2xs font-bold rounded mt-2.5">
              COSTO: ${group.price.toFixed(2)}
            </div>
            {group.zones.map((zone) => (
              <button
                key={zone}
                onClick={() => {
                  setSelectedZone({ name: zone, price: group.price });
                  setZoneSheetOpen(false);
                }}
                className="w-full text-left text-xs py-3 px-1 uppercase border-b border-alonzo-gray-200 active:bg-alonzo-gray-100"
              >
                {zone}
              </button>
            ))}
          </div>
        ))}
      </BottomSheet>

      {/* Method selection sheet */}
      <BottomSheet
        open={methodSheetOpen}
        onClose={() => setMethodSheetOpen(false)}
        title="MÉTODO DE ENVÍO"
        maxHeight="50vh"
      >
        {deliveryMethods.map((m) => (
          <button
            key={m.id}
            onClick={() => {
              setDeliveryType(m.id);
              setMethodSheetOpen(false);
              if (m.id === 'delivery' && !selectedZone) {
                setTimeout(() => setZoneSheetOpen(true), 300);
              }
            }}
            className="w-full text-left text-xs py-3 px-1 uppercase border-b border-alonzo-gray-200 active:bg-alonzo-gray-100"
          >
            {m.label} <span className="text-alonzo-gray-500 text-[9px]">{m.desc}</span>
          </button>
        ))}
      </BottomSheet>
    </>
  );
}
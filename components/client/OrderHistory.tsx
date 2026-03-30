'use client';
import { useState, useEffect } from 'react';
import { Modal, ModalHeader } from '@/components/ui';
import { fetchClientOrders } from '@/lib/api';
import { formatDate, formatUSD } from '@/lib/format';
import type { Invoice } from '@/types';

interface OrderHistoryProps {
  open: boolean;
  onClose: () => void;
  clientId: string;
}

export function OrderHistory({ open, onClose, clientId }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !clientId) return;
    setLoading(true);
    fetchClientOrders(clientId)
      .then(setOrders)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open, clientId]);

  return (
    <Modal open={open} onClose={onClose} zIndex={5500}>
      <ModalHeader title="HISTORIAL DE COMPRAS" onClose={onClose} />

      <div className="flex-1 overflow-y-auto px-5 pb-24">
        {loading ? (
          <p className="text-center mt-10 text-xs text-alonzo-gray-500 uppercase">
            CARGANDO HISTORIAL...
          </p>
        ) : orders.length === 0 ? (
          <p className="text-center mt-10 text-xs text-alonzo-gray-500 uppercase">
            NO TIENES PEDIDOS AÚN
          </p>
        ) : (
          orders.map((order) => (
            <OrderCard key={order.id || order.numericId} order={order} />
          ))
        )}
      </div>
    </Modal>
  );
}

function OrderCard({ order }: { order: Invoice }) {
  const totalItems = order.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 0;

  return (
    <div className="bg-alonzo-gray-100 p-4 mb-4 rounded border border-alonzo-gray-300">
      {/* Header */}
      <div className="flex justify-between mb-3 border-b border-alonzo-gray-300 pb-2">
        <span className="font-bold text-sm">ORDEN #{order.numericId}</span>
        <span className="text-2xs text-alonzo-gray-500">{formatDate(order.date)}</span>
      </div>

      {/* Summary */}
      <div className="text-xs text-alonzo-gray-600 space-y-1 mb-3">
        <div><strong>Total:</strong> {formatUSD(order.total)}</div>
        <div><strong>Artículos:</strong> {totalItems}</div>
        <div><strong>Estado:</strong> {order.status}</div>
      </div>

      {/* Items detail */}
      <div className="bg-white p-3 border border-dashed border-alonzo-gray-400">
        <p className="text-[9px] text-alonzo-gray-500 mb-2">DETALLE PRODUCTOS:</p>
        {order.items?.map((item, i) => (
          <div key={i} className="flex justify-between text-2xs mb-1">
            <span>{item.quantity || 1}x {item.name || item.titulo}</span>
            <span>{formatUSD((item.price || 0) * (item.quantity || 1))}</span>
          </div>
        ))}

        {/* Payments */}
        {order.payments && order.payments.length > 0 && (
          <div className="mt-2 pt-2 border-t border-alonzo-gray-300 text-2xs text-alonzo-gray-600">
            <strong>Pagos:</strong>
            {order.payments.map((p, i) => (
              <div key={i}>
                - {p.method} ${p.amountUsd.toFixed(2)}
                {p.ref ? ` (Ref: ${p.ref})` : ''}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

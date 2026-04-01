'use client';
import { useState, useEffect } from 'react';
import { useClientStore } from '@/stores';
import { fetchClientOrders, fetchClientOrdersByRif } from '@/lib/api';
import { formatUSD } from '@/lib/format';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Package, Clock, CheckCircle, XCircle, Truck, MapPin, CreditCard, ChevronDown, ShoppingBag } from 'lucide-react';
import type { Invoice } from '@/types';

function toDate(d: any): Date {
  if (d?.toDate) return d.toDate();
  if (d instanceof Date) return d;
  return new Date(d);
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  'Finalizado': { label: 'Completado', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200', icon: CheckCircle },
  'Creada': { label: 'En proceso', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200', icon: Clock },
  'Pendiente de pago': { label: 'Pago pendiente', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200', icon: Clock },
  'Cancelado': { label: 'Cancelado', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: XCircle },
  'Devolución': { label: 'Devuelto', color: 'text-gray-600', bg: 'bg-gray-100 border-gray-200', icon: XCircle },
};

const DELIVERY_LABELS: Record<string, string> = {
  'pickup': 'Retiro en tienda',
  'delivery': 'Delivery',
  'nacional': 'Envío nacional',
};

export function AccountOrdersPage() {
  const router = useRouter();
  const { client } = useClientStore();
  const [orders, setOrders] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [limitCount, setLimitCount] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [expandedId, setExpandedId] = useState<string | number | null>(null);

  useEffect(() => {
    if (!client?.id) { router.push('/account'); return; }

    const load = async () => {
      setLoading(true);
      try {
        const byId = await fetchClientOrders(client.id, limitCount);
        let all = [...byId];

        if (client.rif_ci) {
          const byRif = await fetchClientOrdersByRif(client.rif_ci, limitCount);
          byRif.forEach((o) => {
            if (!all.some((a) => a.id === o.id || a.numericId === o.numericId)) all.push(o);
          });
        }

        all.sort((a, b) => b.numericId - a.numericId);
        setHasMore(all.length >= limitCount);
        setOrders(all);
      } catch (err) {
        console.error('Error cargando pedidos:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [client, router, limitCount]);

  const getStatus = (status: string) => STATUS_CONFIG[status] || STATUS_CONFIG['Creada'];

  return (
    <div className="max-w-[1000px] mx-auto px-4 md:px-10 py-12 font-sans min-h-[60vh]">
      <button
        onClick={() => router.push('/account')}
        className="flex items-center text-[11px] font-bold tracking-widest text-gray-400 hover:text-black transition-colors mb-8 uppercase"
      >
        <ChevronLeft size={14} className="mr-1" /> VOLVER A MI CUENTA
      </button>

      <div className="mb-12">
        <h1 className="text-[24px] md:text-[28px] font-light text-black leading-tight tracking-tight mb-2">
          Mis Pedidos
        </h1>
        <p className="text-sm text-gray-500">
          {orders.length > 0 ? `${orders.length} pedido${orders.length > 1 ? 's' : ''} encontrado${orders.length > 1 ? 's' : ''}` : 'Consulta el estado y detalle de tus compras.'}
        </p>
      </div>

      {loading && orders.length === 0 ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border border-gray-100 p-6 animate-pulse">
              <div className="flex gap-4">
                <div className="w-16 h-20 bg-gray-100 rounded shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-3 bg-gray-100 rounded w-1/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-gray-200 rounded-lg">
          <ShoppingBag size={48} strokeWidth={1} className="mx-auto text-gray-300 mb-4" />
          <p className="text-sm text-gray-500 mb-6">Aún no has realizado ninguna compra.</p>
          <button onClick={() => router.push('/')}
            className="bg-black text-white px-8 py-3.5 text-xs font-bold tracking-widest hover:bg-gray-800 transition-colors uppercase">
            EMPEZAR A COMPRAR
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const status = getStatus(order.status);
            const StatusIcon = status.icon;
            const isOpen = expandedId === (order.id || order.numericId);
            const date = toDate(order.date);
            const items = order.items || [];
            const firstImages = items.slice(0, 4).map((it: any) => it.img).filter(Boolean);
            const totalItems = items.reduce((s: number, it: any) => s + (it.quantity || it.qty || 1), 0);

            return (
              <div key={order.id || order.numericId}
                className={`border transition-all duration-300 ${isOpen ? 'border-black shadow-sm' : 'border-gray-200 hover:border-gray-400'}`}>

                {/* ── Collapsed Header ── */}
                <button
                  onClick={() => setExpandedId(isOpen ? null : (order.id || order.numericId))}
                  className="w-full text-left p-5 md:p-6"
                >
                  <div className="flex gap-4 md:gap-6">
                    {/* Product thumbnails - hide when expanded */}
                    {!isOpen && (
                    <div className="flex -space-x-3 shrink-0">
                      {firstImages.length > 0 ? firstImages.map((img: string, i: number) => (
                        <div key={i} className="w-12 h-16 md:w-14 md:h-[72px] bg-gray-100 rounded overflow-hidden border-2 border-white shadow-sm relative"
                          style={{ zIndex: firstImages.length - i }}>
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </div>
                      )) : (
                        <div className="w-12 h-16 md:w-14 md:h-[72px] bg-gray-100 rounded flex items-center justify-center border-2 border-white">
                          <Package size={16} strokeWidth={1} className="text-gray-300" />
                        </div>
                      )}
                      {items.length > 4 && (
                        <div className="w-12 h-16 md:w-14 md:h-[72px] bg-gray-900 rounded flex items-center justify-center border-2 border-white text-white text-xs font-bold"
                          style={{ zIndex: 0 }}>
                          +{items.length - 4}
                        </div>
                      )}
                    </div>
                    )}

                    {/* Order info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            Pedido #{order.numericId}
                          </p>
                          <p className="text-sm font-semibold text-gray-900 mt-1">
                            {totalItems} artículo{totalItems > 1 ? 's' : ''} · {formatUSD(order.total)}
                          </p>
                        </div>
                        <ChevronDown size={16} className={`text-gray-400 shrink-0 mt-1 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-3">
                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${status.bg} ${status.color}`}>
                          <StatusIcon size={10} />
                          {status.label}
                        </span>

                        {/* Date */}
                        <span className="text-[11px] text-gray-400">
                          {date.toLocaleDateString('es-VE', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>

                        {/* Delivery type */}
                        <span className="text-[11px] text-gray-400 hidden sm:inline-flex items-center gap-1">
                          <Truck size={10} />
                          {DELIVERY_LABELS[order.deliveryType] || order.deliveryType}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* ── Expanded Content ── */}
                <div className={`grid transition-all duration-500 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="px-5 md:px-6 pb-6 border-t border-gray-100">

                      {/* Items list */}
                      <div className="py-5 space-y-4">
                        {items.map((item: any, idx: number) => {
                          const name = item.productName || item.titulo || item.name || '—';
                          const qty = item.quantity || item.qty || 1;
                          const price = item.priceAtSale || item.price || 0;
                          const label = item.variantLabel || (item.size ? `${item.size}${item.color ? ' / ' + item.color : ''}` : '');

                          return (
                            <div key={idx} className="flex gap-4 items-center">
                              <div className="w-14 h-[72px] bg-gray-50 rounded overflow-hidden shrink-0">
                                {item.img ? (
                                  <img src={item.img} alt={name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package size={14} strokeWidth={1} className="text-gray-300" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {label && <span>{label} · </span>}
                                  Cant: {qty}
                                </p>
                              </div>
                              <p className="text-sm font-semibold text-gray-900 shrink-0">
                                {formatUSD(price * qty)}
                              </p>
                            </div>
                          );
                        })}
                      </div>

                      {/* Order details grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-5 border-t border-gray-100">
                        {/* Delivery */}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                            <Truck size={14} className="text-gray-400" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Envío</p>
                            <p className="text-sm text-gray-900 mt-0.5">{DELIVERY_LABELS[order.deliveryType] || order.deliveryType}</p>
                            {order.deliveryCostUsd > 0 && (
                              <p className="text-xs text-gray-400">{formatUSD(order.deliveryCostUsd)}</p>
                            )}
                          </div>
                        </div>

                        {/* Address */}
                        {order.clientSnapshot?.address && (
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                              <MapPin size={14} className="text-gray-400" />
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dirección</p>
                              <p className="text-sm text-gray-900 mt-0.5 line-clamp-2">{order.clientSnapshot.address}</p>
                            </div>
                          </div>
                        )}

                        {/* Payment */}
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                            <CreditCard size={14} className="text-gray-400" />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Pago</p>
                            {(order.payments || []).length > 0 ? (
                              order.payments.map((p: any, i: number) => (
                                <p key={i} className="text-sm text-gray-900 mt-0.5">{p.method}</p>
                              ))
                            ) : (
                              <p className="text-sm text-gray-400 mt-0.5 italic">Sin información</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Totals */}
                      <div className="border-t border-gray-100 pt-5 space-y-2">
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Subtotal ({totalItems} artículos)</span>
                          <span>{formatUSD(order.total - (order.deliveryCostUsd || 0))}</span>
                        </div>
                        {order.deliveryCostUsd > 0 && (
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>Envío</span>
                            <span>{formatUSD(order.deliveryCostUsd)}</span>
                          </div>
                        )}
                        {(order as any).appliedCoupon && (
                          <div className="flex justify-between text-sm text-green-600 font-medium">
                            <span>Cupón {(order as any).appliedCoupon.code}</span>
                            <span>- {formatUSD((order as any).appliedCoupon.discountAmount || 0)}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                          <span>Total</span>
                          <span>{formatUSD(order.total)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center mt-10 pb-10">
              <button
                onClick={() => setLimitCount((p) => p + 10)}
                disabled={loading}
                className="px-10 py-3.5 border border-black text-xs font-bold tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-30 uppercase"
              >
                {loading ? 'CARGANDO...' : 'VER MÁS PEDIDOS'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

'use client';
import { useState, useEffect } from 'react';
import { useClientStore } from '@/stores';
import { fetchClientOrders, fetchClientOrdersByRif } from '@/lib/api';
import { formatDate, formatUSD } from '@/lib/format';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import type { Invoice } from '@/types';

export function AccountOrdersPage() {
  const router = useRouter();
  const { client } = useClientStore();
  const [orders, setOrders] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [limitCount, setLimitCount] = useState(5);
  const [hasMore, setHasMore] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<string | number | null>(null);

  const toggleOrder = (orderId: string | number) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  useEffect(() => {
    if (!client?.id) {
      router.push('/account');
      return;
    }
    
    const loadOrders = async () => {
      setLoading(true);
      try {
        // 1. Intentar por Client ID (Nuevo sistema vinculado a UID)
        const byId = await fetchClientOrders(client.id, limitCount);
        let all = [...byId];
        
        // 2. Si tiene RIF en su perfil, buscar también por ese RIF (órdenes legacy)
        if (client.rif_ci) {
          const byRif = await fetchClientOrdersByRif(client.rif_ci, limitCount);
          byRif.forEach(order => {
            const exists = all.some(a => 
              (a.id === order.id) || (a.numericId === order.numericId)
            );
            if (!exists) all.push(order);
          });
        }
        
        // Orden final por numericId descendente
        all.sort((a, b) => b.numericId - a.numericId);
        
        // Determinar si hay más
        setHasMore(all.length >= limitCount);
        
        setOrders(all);
      } catch (err) {
        console.error("Error cargando pedidos:", err);
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, [client, router, limitCount]);

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completado':
      case 'pagado':
        return <CheckCircle size={14} className="text-green-500" />;
      case 'cancelado':
        return <XCircle size={14} className="text-red-500" />;
      default:
        return <Clock size={14} className="text-amber-500" />;
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 md:px-10 py-12 font-sans min-h-[60vh]">
      {/* Breadcrumb / Back */}
      <button 
        onClick={() => router.push('/account')}
        className="flex items-center text-[11px] font-bold tracking-widest text-gray-400 hover:text-black transition-colors mb-8 uppercase"
      >
        <ChevronLeft size={14} className="mr-1" /> VOLVER A MI CUENTA
      </button>

      <h1 className="text-[24px] md:text-[28px] font-light text-black leading-tight tracking-tight mb-2">Mis Pedidos</h1>
      <p className="text-sm text-gray-500 mb-12">Consulta el estado y detalle de tus compras anteriores.</p>

      {loading && orders.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-xs font-bold tracking-widest text-gray-400 uppercase animate-pulse">Cargando tu historial...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-gray-200 rounded-lg">
          <Package size={48} strokeWidth={1} className="mx-auto text-gray-300 mb-4" />
          <p className="text-sm text-gray-500 mb-6">Aún no has realizado ninguna compra.</p>
          <button 
            onClick={() => router.push('/')}
            className="btn-primary !w-auto px-8 py-3 translate-x-0"
          >
            EMPEZAR A COMPRAR
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id || order.numericId} className="border border-gray-200 bg-white hover:border-black transition-colors">
                {/* Order Header */}
                <div 
                  onClick={() => toggleOrder(order.id || order.numericId)}
                  className={`px-6 py-4 flex flex-wrap justify-between items-center border-b border-gray-200 gap-4 cursor-pointer transition-colors ${
                    expandedOrderId === (order.id || order.numericId) ? 'bg-black text-white' : 'bg-gray-50 text-black hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-6">
                    <div className="space-y-1">
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${expandedOrderId === (order.id || order.numericId) ? 'text-gray-400' : 'text-gray-400'}`}>Pedido No.</p>
                      <p className="text-sm font-bold">#{order.numericId}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Fecha</p>
                      <p className="text-sm">{formatDate(order.date)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 md:gap-12">
                    <div className="space-y-1 hidden sm:block">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Estado</p>
                      <div className="flex items-center gap-1.5 text-sm font-medium">
                        {getStatusIcon(order.status)}
                        <span className="capitalize">{order.status.toLowerCase()}</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-right min-w-[80px]">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Total</p>
                      <p className="text-sm font-bold">{formatUSD(order.total)}</p>
                    </div>
                    <div className={`transition-transform duration-300 ${expandedOrderId === (order.id || order.numericId) ? 'rotate-180 text-white' : 'text-gray-400'}`}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Order Content with Transition */}
                <div 
                  className={`grid transition-all duration-500 ease-in-out ${
                    expandedOrderId === (order.id || order.numericId) 
                      ? 'grid-rows-[1fr] opacity-100' 
                      : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="p-6">
                      <div className="space-y-4">
                        {order.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <div className="flex gap-4 items-center">
                              <div className="w-12 h-16 bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden grayscale text-[8px] text-gray-400">
                                {item.img ? (
                                  <img 
                                    src={item.img} 
                                    alt={item.name || item.titulo} 
                                    className="w-full h-full object-cover"
                                    onError={(e) => (e.currentTarget.style.display = 'none')}
                                  />
                                ) : (
                                  <Package size={16} strokeWidth={1} />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{item.quantity || 1}x {item.name || item.titulo}</p>
                                <p className="text-xs text-gray-500 uppercase tracking-tighter">Color: {item.color || 'N/A'} | Talla: {item.size || 'N/A'}</p>
                              </div>
                            </div>
                            <p className="font-medium">{formatUSD((item.price || 0) * (item.quantity || 1))}</p>
                          </div>
                        ))}
                      </div>

                      {/* Footer / Actions */}
                      <div className="mt-8 pt-6 border-t border-gray-100 flex justify-between items-center">
                        <div className="sm:hidden">
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Estado</p>
                          <div className="flex items-center gap-1.5 text-xs font-medium">
                            {getStatusIcon(order.status)}
                            <span className="capitalize">{order.status.toLowerCase()}</span>
                          </div>
                        </div>
                        <button className="text-[11px] font-bold tracking-widest hover:underline uppercase ml-auto">
                          Ver factura (PDF)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {hasMore && (
            <div className="flex justify-center mt-12 pb-20">
              <button
                onClick={() => setLimitCount(prev => prev + 10)}
                disabled={loading}
                className="px-10 py-3.5 border border-black text-xs font-bold tracking-widest hover:bg-black hover:text-white transition-all disabled:opacity-30 uppercase"
              >
                {loading ? 'Cargando...' : 'Ver más pedidos'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

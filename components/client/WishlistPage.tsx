'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ChevronLeft, ShoppingCart, Trash2 } from 'lucide-react';
import { useWishlist } from '@/lib/useWishlist';
import { useCartStore } from '@/stores';
import { useToast } from '@/components/ui';
import { fetchProducts } from '@/lib/api';
import type { Product } from '@/types';

export function WishlistPage() {
  const router = useRouter();
  const toast = useToast();
  const { items: wishlistIds, loading: wishLoading, remove } = useWishlist();
  const { addItem } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts()
      .then(setProducts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const wishlistProducts = products.filter((p) => wishlistIds.includes(p.id));
  const isLoading = loading || wishLoading;

  function handleAddToCart(product: Product) {
    if (product.variants.length === 0) return;
    // Add first available variant
    const variant = product.variants.find((v) => parseInt(v.stock) > 0);
    if (!variant) {
      toast.show('PRODUCTO AGOTADO');
      return;
    }
    const idx = product.variants.indexOf(variant);
    addItem({
      key: `${product.id}-${variant.size}-${variant.color}`,
      productId: product.id,
      titulo: product.name,
      img: product.imageUrl,
      precio: variant.price,
      qty: 1,
      size: variant.size,
      color: variant.color,
      variantIndex: idx,
    });
    toast.show('AÑADIDO AL CARRITO');
  }

  function handleRemove(productId: string) {
    remove(productId);
    toast.show('ELIMINADO DE FAVORITOS');
  }

  // Offer helpers
  function getDiscountedPrice(product: Product, price: number): number | null {
    if (!product.offer || !product.offer.value) return null;
    if (product.offer.type === 'percentage') return price - (price * product.offer.value / 100);
    return Math.max(0, price - product.offer.value);
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 md:px-10 py-12 font-sans min-h-[60vh]">
      <button
        onClick={() => router.push('/account')}
        className="flex items-center text-[11px] font-bold tracking-widest text-gray-400 hover:text-black transition-colors mb-8 uppercase"
      >
        <ChevronLeft size={14} className="mr-1" /> VOLVER A MI CUENTA
      </button>

      <h1 className="text-[24px] md:text-[28px] font-light text-black leading-tight tracking-tight mb-2">
        Mis Favoritos
      </h1>
      <p className="text-sm text-gray-500 mb-12">
        {wishlistProducts.length > 0
          ? `Tienes ${wishlistProducts.length} producto${wishlistProducts.length > 1 ? 's' : ''} guardado${wishlistProducts.length > 1 ? 's' : ''}.`
          : 'Guarda tus productos favoritos para comprarlos después.'}
      </p>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-5 p-5 border border-gray-200 animate-pulse">
              <div className="w-24 h-32 bg-gray-100 rounded shrink-0" />
              <div className="flex-1 space-y-3">
                <div className="h-3 bg-gray-100 rounded w-3/4" />
                <div className="h-3 bg-gray-100 rounded w-1/2" />
                <div className="h-8 bg-gray-100 rounded w-full mt-6" />
              </div>
            </div>
          ))}
        </div>
      ) : wishlistProducts.length === 0 ? (
        <div className="py-20 text-center border border-dashed border-gray-200 rounded-lg">
          <Heart size={48} strokeWidth={1} className="mx-auto text-gray-300 mb-4" />
          <p className="text-sm text-gray-500 mb-6">Aún no tienes favoritos.</p>
          <button
            onClick={() => router.push('/')}
            className="bg-black text-white px-8 py-3.5 text-xs font-bold tracking-widest hover:bg-gray-800 transition-colors uppercase"
          >
            EXPLORAR PRODUCTOS
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wishlistProducts.map((product) => {
            const rawPrice = product.variants[0] ? parseFloat(product.variants[0].price) : 0;
            const discPrice = getDiscountedPrice(product, rawPrice);
            const hasOffer = discPrice !== null;

            return (
              <div key={product.id} className="flex gap-5 p-5 border border-gray-200 hover:border-black transition-colors group">
                {/* Image */}
                <div
                  className="w-24 h-32 bg-gray-100 rounded shrink-0 overflow-hidden cursor-pointer relative"
                  onClick={() => router.push(`/product/${product.id}`)}
                >
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  />
                  {hasOffer && (
                    <div className="absolute top-1 left-1 bg-red-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm">
                      {product.offer!.type === 'percentage' ? `-${product.offer!.value}%` : `-$${product.offer!.value}`}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">{product.category}</p>
                    <p
                      className="text-sm font-medium text-gray-900 mt-1 cursor-pointer hover:underline"
                      onClick={() => router.push(`/product/${product.id}`)}
                    >
                      {product.name}
                    </p>
                    <div className="mt-1.5">
                      {hasOffer ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-red-600">${discPrice!.toFixed(2)}</span>
                          <span className="text-xs text-gray-400 line-through">${rawPrice.toFixed(2)}</span>
                        </div>
                      ) : (
                        <p className="text-sm font-semibold text-gray-900">${rawPrice.toFixed(2)}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-black text-white text-[10px] font-bold tracking-widest hover:bg-gray-800 transition-colors uppercase"
                    >
                      <ShoppingCart size={12} /> AÑADIR
                    </button>
                    <button
                      onClick={() => handleRemove(product.id)}
                      className="px-3 py-2.5 border border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

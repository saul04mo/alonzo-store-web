'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ChevronDown, Truck, X } from 'lucide-react';
import { useCartStore } from '@/stores';
import { useToast } from '@/components/ui';
import { getSizeGuideImage } from '@/config';
import type { Product, ProductVariant } from '@/types';

interface ProductDetailPageProps {
  product: Product | null;
  loading?: boolean;
  error?: string;
}

export function ProductDetailPage({ product, loading = false, error = '' }: ProductDetailPageProps) {
  const router = useRouter();
  const toast = useToast();
  const { addItem } = useCartStore();

  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [sizeDropdownOpen, setSizeDropdownOpen] = useState(false);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [product?.id]);

  // Reset state when product changes
  useEffect(() => {
    setSelectedVariantIdx(null);
    setSizeDropdownOpen(false);
    setSizeGuideOpen(false);
  }, [product?.id]);

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-10 py-6 md:py-10 font-sans">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 lg:gap-16">
          <div className="w-full md:w-[58%] aspect-[3/4] skeleton-shimmer rounded-lg" />
          <div className="w-full md:w-[42%] space-y-4">
            <div className="h-4 w-1/3 skeleton-shimmer rounded" />
            <div className="h-8 w-2/3 skeleton-shimmer rounded" />
            <div className="h-6 w-1/4 skeleton-shimmer rounded mt-4" />
            <div className="h-12 w-full skeleton-shimmer rounded mt-6" />
            <div className="h-14 w-full skeleton-shimmer rounded mt-5" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-20 text-center font-sans">
        <p className="text-gray-500 mb-4">{error || 'Producto no encontrado'}</p>
        <button
          onClick={() => router.push('/')}
          className="text-sm underline text-black"
        >
          Volver a la tienda
        </button>
      </div>
    );
  }

  const hasVariants = product.variants.length > 0;
  const price = hasVariants ? product.variants[0].price : product.price || '0.00';
  const selectedVariant = selectedVariantIdx !== null ? product.variants[selectedVariantIdx] : null;
  const sizeGuideImg = getSizeGuideImage(product.category, product.gender);

  // Offer calculations
  const hasOffer = product.offer && product.offer.value > 0;
  const displayPrice = selectedVariant ? parseFloat(selectedVariant.price) : parseFloat(price);
  const discountedPrice = hasOffer
    ? (product.offer!.type === 'percentage'
        ? displayPrice - (displayPrice * product.offer!.value / 100)
        : Math.max(0, displayPrice - product.offer!.value))
    : displayPrice;

  const handleAddToCart = () => {
    if (hasVariants) {
      if (selectedVariant) {
        const itemKey = `${product.id}-${selectedVariant.size}-${selectedVariant.color}`;
        const cartItems = useCartStore.getState().items;
        const existing = cartItems.find((i) => i.key === itemKey);

        if (existing) {
          if (existing.qty < parseInt(selectedVariant.stock)) {
            const idx = cartItems.indexOf(existing);
            useCartStore.getState().updateQty(idx, 1);
            toast.show('Cantidad actualizada');
          } else {
            toast.show('Stock máximo alcanzado');
            return;
          }
        } else {
          addItem({
            key: itemKey,
            productId: product.id,
            titulo: product.name,
            img: product.imageUrl,
            precio: selectedVariant.price,
            qty: 1,
            size: selectedVariant.size,
            color: selectedVariant.color,
            variantIndex: selectedVariantIdx!,
          });
          toast.show('Añadido al carrito');
        }
      } else {
        setSizeDropdownOpen(true);
        return;
      }
    } else {
      addItem({
        key: product.id,
        productId: product.id,
        titulo: product.name,
        img: product.imageUrl,
        precio: product.price || '0',
        qty: 1,
        size: '',
        color: '',
        variantIndex: 0,
      });
      toast.show('Añadido al carrito');
    }
  };

  const handleVariantSelect = (variant: ProductVariant, idx: number) => {
    setSelectedVariantIdx(idx);
    setSizeDropdownOpen(false);
  };

  return (
    <>
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-10 py-6 md:py-10 font-sans animate-fade-in">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors mb-6"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
          </svg>
          Volver
        </button>

        <div className="flex flex-col md:flex-row gap-8 md:gap-12 lg:gap-16">
          {/* ── LEFT: Image gallery ── */}
          <div className="w-full md:w-[58%] flex flex-col md:flex-row gap-4 animate-slide-up">
            <div className="hidden md:flex flex-col gap-3 w-[100px] shrink-0">
              <div className="w-full aspect-square rounded-lg overflow-hidden border-2 border-black cursor-pointer">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover object-top"
                />
              </div>
            </div>
            <div className="flex-1 aspect-[3/4] rounded-lg overflow-hidden bg-gray-50">
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover object-top"
              />
            </div>
          </div>

          {/* ── RIGHT: Product info ── */}
          <div className="w-full md:w-[42%] md:sticky md:top-28 md:self-start animate-fade-in" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
            <p className="text-xs text-gray-400 font-medium tracking-wider mb-1">
              {product.category}
            </p>

            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <img
                  src="/images/logoAlonzo.png"
                  alt="Alonzo"
                  className="h-8 md:h-9 w-auto object-contain"
                />
                <p className="text-base text-gray-600 mt-1">
                  {product.name}
                </p>
              </div>
              <button
                onClick={() => setLiked(!liked)}
                className="mt-1 shrink-0"
              >
                <Heart
                  size={22}
                  strokeWidth={1.5}
                  className={liked ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-gray-600 transition-colors'}
                />
              </button>
            </div>

            <p className="text-xl font-semibold text-gray-900 mt-4">
              ${selectedVariant ? selectedVariant.price : price}
            </p>

            {hasOffer && (
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xl font-semibold text-red-600">
                  ${discountedPrice.toFixed(2)}
                </span>
                <span className="inline-flex items-center bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm">
                  {product.offer!.type === 'percentage'
                    ? `-${product.offer!.value}%`
                    : `-$${product.offer!.value}`}
                </span>
              </div>
            )}

            {sizeGuideImg && (
              <div className="flex justify-end mt-4">
                <button
                  onClick={() => setSizeGuideOpen(true)}
                  className="text-xs text-gray-500 underline hover:text-black transition-colors"
                >
                  Guía de tallas
                </button>
              </div>
            )}

            {hasVariants && (
              <div className={`relative ${sizeGuideImg ? 'mt-2' : 'mt-6'}`}>
                <button
                  onClick={() => setSizeDropdownOpen(!sizeDropdownOpen)}
                  className={`w-full border rounded-lg px-4 py-3.5 text-base flex justify-between items-center cursor-pointer transition-colors bg-white ${sizeDropdownOpen ? 'border-black' : 'border-gray-300 hover:border-gray-500'
                    }`}
                >
                  <span className={selectedVariant ? 'text-gray-900' : 'text-gray-400'}>
                    {selectedVariant
                      ? `${selectedVariant.size}${selectedVariant.color ? ` — ${selectedVariant.color}` : ''}`
                      : 'Seleccionar talla'
                    }
                  </span>
                  <ChevronDown
                    size={18}
                    className={`text-gray-400 transition-transform ${sizeDropdownOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {sizeDropdownOpen && (
                  <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden max-h-[250px] overflow-y-auto">
                    {product.variants.map((v, idx) => {
                      const inStock = parseInt(v.stock) > 0;
                      return (
                        <button
                          key={`${v.size}-${v.color}-${idx}`}
                          disabled={!inStock}
                          onClick={() => handleVariantSelect(v, idx)}
                          className={`w-full text-left px-4 py-3.5 text-sm border-b border-gray-100 last:border-0 flex items-center justify-between transition-colors ${inStock
                              ? 'hover:bg-gray-50 text-gray-900 cursor-pointer'
                              : 'text-gray-300 cursor-not-allowed'
                            } ${selectedVariantIdx === idx ? 'bg-gray-50 font-medium' : ''}`}
                        >
                          <span>
                            {v.size}
                            {v.color && (
                              <span className="text-gray-500 ml-2">— {v.color}</span>
                            )}
                          </span>
                          {!inStock && (
                            <span className="text-xs text-gray-400">Agotado</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleAddToCart}
              className="w-full py-4 mt-5 bg-black text-white text-base font-medium rounded-lg hover:bg-gray-900 transition-colors cursor-pointer"
            >
              Añadir a la bolsa
            </button>

            {selectedVariant && parseInt(selectedVariant.stock) <= 3 && parseInt(selectedVariant.stock) > 0 && (
              <p className="mt-3 text-sm font-medium text-amber-600">
                Última(s) pieza(s) <span className="font-normal text-gray-500">¡Hazla tuya!</span>
              </p>
            )}

            <div className="mt-8 space-y-4 border-t border-gray-200 pt-6">
              <div className="flex items-start gap-3">
                <Truck size={18} className="text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Entrega estimada</p>
                  <p className="text-xs text-gray-500 mt-0.5">3 - 10 días hábiles</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Size guide popup */}
      {sizeGuideOpen && sizeGuideImg && (
        <div
          className="fixed inset-0 z-[9000] bg-black/85 flex items-center justify-center animate-fade-in"
          onClick={() => setSizeGuideOpen(false)}
        >
          <div className="relative w-[95%] max-w-[400px] max-h-[80vh] bg-white p-1 rounded overflow-hidden">
            <button
              onClick={() => setSizeGuideOpen(false)}
              className="absolute top-2.5 right-2.5 bg-white/90 rounded-full w-8 h-8 flex items-center justify-center z-10"
            >
              <X size={16} />
            </button>
            <img
              src={sizeGuideImg}
              alt="Guía de Tallas"
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, ChevronDown, Truck, X, Minus, Plus } from 'lucide-react';
import { useCartStore, useUIStore } from '@/stores';
import { useToast } from '@/components/ui';
import { getSizeGuideImage } from '@/config';
import { useWishlist } from '@/lib/useWishlist';
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
  const setCartDrawerOpen = useUIStore((s) => s.setCartDrawerOpen);

  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState<number | null>(null);
  const [qty, setQty] = useState(1);
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);
  const [mainImage, setMainImage] = useState('');
  const { toggle: toggleWishlist, isInWishlist } = useWishlist();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [product?.id]);

  // Reset state when product changes
  useEffect(() => {
    setSelectedVariantIdx(null);
    setSizeGuideOpen(false);
    setQty(1);
    setActiveAccordion(null);
    if (product) setMainImage(product.imageUrl);
  }, [product?.id]);

  // Loading state
  if (loading) {
    return (
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-10 py-6 md:py-10">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12 lg:gap-16">
          <div className="w-full md:w-[55%]">
            <div className="aspect-[3/4] skeleton-shimmer rounded-sm" />
            <div className="flex gap-2 mt-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-[72px] h-[72px] skeleton-shimmer rounded-sm" />
              ))}
            </div>
          </div>
          <div className="w-full md:w-[45%] space-y-4">
            <div className="h-5 w-2/3 skeleton-shimmer rounded" />
            <div className="h-6 w-1/4 skeleton-shimmer rounded" />
            <div className="h-4 w-1/3 skeleton-shimmer rounded mt-6" />
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-10 h-10 skeleton-shimmer rounded-sm" />
              ))}
            </div>
            <div className="h-14 w-full skeleton-shimmer rounded mt-6" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-[1400px] mx-auto px-5 md:px-10 py-20 text-center">
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

  // Unique sizes for inline selector
  const sizeEntries = new Map<string, { variantIndex: number; stock: number; color: string }>();
  product.variants.forEach((v, idx) => {
    if (v.size && !sizeEntries.has(v.size)) {
      sizeEntries.set(v.size, {
        variantIndex: idx,
        stock: parseInt(v.stock) || 0,
        color: v.color || '',
      });
    }
  });
  const sizes = Array.from(sizeEntries.entries());

  const handleAddToCart = () => {
    if (hasVariants) {
      if (selectedVariant) {
        const itemKey = `${product.id}-${selectedVariant.size}-${selectedVariant.color}`;
        const cartItems = useCartStore.getState().items;
        const existing = cartItems.find((i) => i.key === itemKey);

        if (existing) {
          if (existing.qty + qty <= parseInt(selectedVariant.stock)) {
            const idx = cartItems.indexOf(existing);
            for (let i = 0; i < qty; i++) {
              useCartStore.getState().updateQty(idx, 1);
            }
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
            qty,
            size: selectedVariant.size,
            color: selectedVariant.color,
            variantIndex: selectedVariantIdx!,
          });
          toast.show('Añadido al carrito');
        }
        setCartDrawerOpen(true);
      } else {
        toast.show('Selecciona una talla');
        return;
      }
    } else {
      addItem({
        key: product.id,
        productId: product.id,
        titulo: product.name,
        img: product.imageUrl,
        precio: product.price || '0',
        qty,
        size: '',
        color: '',
        variantIndex: 0,
      });
      toast.show('Añadido al carrito');
      setCartDrawerOpen(true);
    }
  };

  const toggleAccordion = (key: string) => {
    setActiveAccordion(activeAccordion === key ? null : key);
  };

  return (
    <>
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-10 py-4 md:py-8">
        <div className="flex flex-col md:flex-row gap-6 md:gap-10 lg:gap-14">

          {/* ══════ LEFT: Image Gallery ══════ */}
          <div className="w-full md:w-[55%]">
            {/* Main image */}
            <div className="aspect-[3/4] overflow-hidden bg-alonzo-gray-100 rounded-sm">
              <img
                src={mainImage || product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover object-top transition-opacity duration-500"
              />
            </div>

            {/* Thumbnails row */}
            {product.variants.length > 0 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {/* Main image thumb */}
                <button
                  onClick={() => setMainImage(product.imageUrl)}
                  className={`w-[68px] h-[68px] md:w-[80px] md:h-[80px] flex-shrink-0 overflow-hidden rounded-sm border-2 transition-colors ${
                    mainImage === product.imageUrl ? 'border-alonzo-black' : 'border-transparent hover:border-alonzo-gray-300'
                  }`}
                >
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover object-top"
                  />
                </button>
              </div>
            )}
          </div>

          {/* ══════ RIGHT: Product Info ══════ */}
          <div className="w-full md:w-[45%] md:sticky md:top-24 md:self-start">

            {/* Product name + price */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-sm md:text-base tracking-[0.08em] uppercase font-semibold text-alonzo-charcoal leading-snug">
                {product.name}
              </h1>
              <div className="flex items-center gap-3 shrink-0">
                {hasOffer ? (
                  <p className="text-base md:text-lg font-semibold text-red-600 whitespace-nowrap">
                    ${discountedPrice.toFixed(2)}
                  </p>
                ) : (
                  <p className="text-base md:text-lg font-semibold text-alonzo-charcoal whitespace-nowrap">
                    ${displayPrice.toFixed(2)}
                  </p>
                )}
                <button
                  onClick={() => product && toggleWishlist(product.id)}
                  className="shrink-0"
                >
                  <Heart
                    size={20}
                    strokeWidth={1.5}
                    className={product && isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-alonzo-gray-400 hover:text-alonzo-gray-600 transition-colors'}
                  />
                </button>
              </div>
            </div>

            {/* Offer badge */}
            {hasOffer && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-alonzo-gray-400 line-through">
                  ${displayPrice.toFixed(2)}
                </span>
                <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">
                  {product.offer!.type === 'percentage'
                    ? `-${product.offer!.value}%`
                    : `-$${product.offer!.value}`}
                </span>
              </div>
            )}

            {/* Size label + guide link */}
            {hasVariants && (
              <div className="flex items-center justify-between mt-6 mb-2">
                <p className="text-xs tracking-[0.06em] text-alonzo-charcoal font-medium">
                  Size:
                </p>
                {sizeGuideImg && (
                  <button
                    onClick={() => setSizeGuideOpen(true)}
                    className="text-[11px] text-alonzo-gray-500 underline underline-offset-2 hover:text-alonzo-black transition-colors italic"
                  >
                    Size Table
                  </button>
                )}
              </div>
            )}

            {/* Inline size selector */}
            {hasVariants && (
              <div className="flex flex-wrap gap-0 border border-alonzo-gray-300">
                {sizes.map(([size, info], idx) => {
                  const inStock = info.stock > 0;
                  const isSelected = selectedVariantIdx === info.variantIndex;
                  return (
                    <button
                      key={size}
                      disabled={!inStock}
                      onClick={() => setSelectedVariantIdx(isSelected ? null : info.variantIndex)}
                      className={`flex-1 min-w-[40px] py-2.5 text-[12px] md:text-[13px] font-semibold uppercase text-center relative transition-all duration-150 ${
                        idx > 0 ? 'border-l border-alonzo-gray-300' : ''
                      } ${isSelected
                        ? 'bg-alonzo-black text-white'
                        : inStock
                          ? 'text-alonzo-charcoal hover:bg-alonzo-gray-100'
                          : 'text-alonzo-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {size}
                      {!inStock && (
                        <svg className="absolute inset-0 w-full h-full text-alonzo-gray-300 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <line x1="0" y1="100" x2="100" y2="0" stroke="currentColor" strokeWidth="1" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Low stock warning */}
            {selectedVariant && parseInt(selectedVariant.stock) <= 3 && parseInt(selectedVariant.stock) > 0 && (
              <p className="mt-2 text-[11px] font-medium text-amber-600 tracking-wide">
                ¡Última(s) pieza(s) disponible(s)!
              </p>
            )}

            {/* Quantity selector */}
            <div className="flex items-center gap-0 mt-4 border border-alonzo-gray-300 w-fit">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 flex items-center justify-center text-alonzo-gray-500 hover:text-alonzo-black transition-colors"
              >
                <Minus size={14} />
              </button>
              <span className="w-10 h-10 flex items-center justify-center text-sm font-medium text-alonzo-charcoal border-x border-alonzo-gray-300">
                {qty}
              </span>
              <button
                onClick={() => setQty(Math.min(99, qty + 1))}
                className="w-10 h-10 flex items-center justify-center text-alonzo-gray-500 hover:text-alonzo-black transition-colors"
              >
                <Plus size={14} />
              </button>
            </div>

            {/* ADD TO CART button */}
            <button
              onClick={handleAddToCart}
              className="w-full py-4 mt-5 bg-alonzo-gray-500 hover:bg-alonzo-black text-white text-[12px] tracking-[0.2em] uppercase font-semibold rounded-sm transition-colors duration-200"
            >
              Add to Cart
            </button>

            {/* Description */}
            <div className="mt-6 border-t border-alonzo-gray-200 pt-4">
              <p className="text-[11px] leading-relaxed text-alonzo-gray-600 tracking-wide">
                {product.name} de la colección {product.category}. Diseñado con los más altos
                estándares de calidad y fabricación premium. Corte moderno con acabado profesional.
              </p>
            </div>

            {/* Accordion sections */}
            <div className="mt-4 border-t border-alonzo-gray-200">
              {/* Details */}
              <button
                onClick={() => toggleAccordion('details')}
                className="w-full flex items-center justify-between py-3.5 text-left border-b border-alonzo-gray-200"
              >
                <span className="text-[11px] tracking-[0.1em] uppercase font-medium text-alonzo-charcoal">
                  Details
                </span>
                <span className="text-[11px] text-alonzo-gray-400">
                  {activeAccordion === 'details' ? '−' : '+'}
                </span>
              </button>
              {activeAccordion === 'details' && (
                <div className="py-3 text-[11px] text-alonzo-gray-600 leading-relaxed tracking-wide accordion-reveal">
                  <p>Categoría: {product.category}</p>
                  <p>Género: {product.gender}</p>
                  {selectedVariant && <p>Color: {selectedVariant.color}</p>}
                  {hasVariants && <p>Tallas disponibles: {sizes.map(([s]) => s).join(', ')}</p>}
                </div>
              )}

              {/* Shipping */}
              <button
                onClick={() => toggleAccordion('shipping')}
                className="w-full flex items-center justify-between py-3.5 text-left border-b border-alonzo-gray-200"
              >
                <span className="text-[11px] tracking-[0.1em] uppercase font-medium text-alonzo-charcoal">
                  Envío y Pedidos
                </span>
                <span className="text-[11px] text-alonzo-gray-400">
                  {activeAccordion === 'shipping' ? '−' : '+'}
                </span>
              </button>
              {activeAccordion === 'shipping' && (
                <div className="py-3 text-[11px] text-alonzo-gray-600 leading-relaxed tracking-wide accordion-reveal">
                  <p>Entrega estimada: 3 - 10 días hábiles.</p>
                  <p className="mt-1">Envío disponible a nivel nacional.</p>
                  <p className="mt-1">Retiro en tienda disponible sin costo.</p>
                </div>
              )}

              {/* Returns */}
              <button
                onClick={() => toggleAccordion('returns')}
                className="w-full flex items-center justify-between py-3.5 text-left border-b border-alonzo-gray-200"
              >
                <span className="text-[11px] tracking-[0.1em] uppercase font-medium text-alonzo-charcoal">
                  Devoluciones y Cambios
                </span>
                <span className="text-[11px] text-alonzo-gray-400">
                  {activeAccordion === 'returns' ? '−' : '+'}
                </span>
              </button>
              {activeAccordion === 'returns' && (
                <div className="py-3 text-[11px] text-alonzo-gray-600 leading-relaxed tracking-wide accordion-reveal">
                  <p>Aceptamos cambios y devoluciones dentro de los primeros 7 días posteriores a la compra.</p>
                  <p className="mt-1">El producto debe estar en perfectas condiciones y con su etiqueta original.</p>
                </div>
              )}
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

      <style jsx>{`
        @keyframes accordionReveal {
          from { opacity: 0; max-height: 0; }
          to { opacity: 1; max-height: 200px; }
        }
        .accordion-reveal {
          animation: accordionReveal 0.25s ease-out;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}
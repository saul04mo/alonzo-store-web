'use client';
import { BottomSheet } from '@/components/ui';
import type { Product, ProductVariant } from '@/types';

interface SizeSelectorProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onSelect: (variant: ProductVariant, variantIndex: number) => void;
}

export function SizeSelector({ product, open, onClose, onSelect }: SizeSelectorProps) {
  if (!product) return null;

  return (
    <BottomSheet open={open} onClose={onClose} title="SELECCIONA TU TALLA" zIndex={3500}>
      {product.variants.map((variant, idx) => {
        const inStock = parseInt(variant.stock) > 0;
        return (
          <button
            key={`${variant.size}-${variant.color}-${idx}`}
            disabled={!inStock}
            onClick={() => {
              if (inStock) onSelect(variant, idx);
            }}
            className={`
              w-full py-4 text-left text-base uppercase border-b border-alonzo-gray-200
              transition-colors duration-200
              ${
                inStock
                  ? 'text-alonzo-charcoal active:bg-alonzo-gray-100 active:font-bold cursor-pointer'
                  : 'text-alonzo-gray-400 line-through cursor-not-allowed'
              }
            `}
          >
            <span>{variant.size}</span>
            {variant.color && (
              <span className="text-alonzo-gray-500 ml-2 text-sm">— {variant.color}</span>
            )}
            {!inStock && (
              <span className="text-alonzo-gray-400 ml-2 text-2xs">AGOTADO</span>
            )}
          </button>
        );
      })}
    </BottomSheet>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { ProductDetailPage } from '@/components/products/ProductDetail';
import { fetchProduct, seedProduct } from '@/lib/api';
import type { Product } from '@/types';

export function ProductDetailClient({
  id,
  initialProduct = null,
}: {
  id: string;
  initialProduct?: Product | null;
}) {
  // Arrancamos con el producto que bajó el servidor → render inmediato
  // (la imagen con priority ya está en el HTML), sin skeleton.
  const [product, setProduct] = useState<Product | null>(initialProduct);
  const [loading, setLoading] = useState(!initialProduct);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;

    if (initialProduct) {
      // Ya tenemos datos del servidor: sembramos cache (navegación interna
      // instantánea) y refrescamos en silencio, sin volver a skeleton.
      seedProduct(initialProduct);
      setProduct(initialProduct);
      setLoading(false);
      setError('');
      fetchProduct(id).then(setProduct).catch(() => {});
      return;
    }

    // Sin datos del servidor (caso raro): fetch normal con skeleton.
    setProduct(null);
    setLoading(true);
    setError('');
    fetchProduct(id)
      .then(setProduct)
      .catch((err) => setError(err.message || 'Producto no encontrado'))
      .finally(() => setLoading(false));
  }, [id, initialProduct]);

  return <ProductDetailPage product={product} loading={loading} error={error} />;
}

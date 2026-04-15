'use client';

import { useState, useEffect } from 'react';
import { ProductDetailPage } from '@/components/products/ProductDetail';
import { fetchProduct } from '@/lib/api';
import type { Product } from '@/types';

export function ProductDetailClient({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError('');
    fetchProduct(id)
      .then(setProduct)
      .catch((err) => setError(err.message || 'Producto no encontrado'))
      .finally(() => setLoading(false));
  }, [id]);

  return <ProductDetailPage product={product} loading={loading} error={error} />;
}

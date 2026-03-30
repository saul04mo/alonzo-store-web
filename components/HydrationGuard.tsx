'use client';

import { useState, useEffect, type ReactNode } from 'react';

/**
 * HydrationGuard — USO SELECTIVO
 * Solo envuelve componentes que dependen de Zustand persist (cart badge, etc.)
 * NO envolver toda la app con esto.
 */
export function HydrationGuard({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{fallback || null}</>;
  }

  return <>{children}</>;
}

import { hombreCategoryOrder } from '@/config';
import type { Product, Gender } from '@/types';

/**
 * Calcula la lista ordenada de categorías a partir de un catálogo de
 * productos y el género activo.
 *
 * Fuente única de verdad: antes esta misma lógica estaba duplicada en
 * AppShell (precarga del menú) y en HomePage (cálculo del grid). Si las
 * dos copias se desincronizaban, el orden de las categorías cambiaba
 * según quién las calculara. Ahora ambas llaman acá.
 *
 * Reglas:
 *  - Se ignoran categorías vacías y la categoría técnica "EXTRAS".
 *  - Mujer: orden alfabético inverso (criterio actual del catálogo).
 *  - Hombre: orden manual via hombreCategoryOrder; lo no listado queda
 *    al final, desempatado alfabéticamente.
 */
export function computeCategories(products: Product[], gender: Gender): string[] {
  const unique = new Set<string>();
  products.forEach((p) => {
    const cat = p.category.trim().toUpperCase();
    if (cat && cat !== 'EXTRAS') unique.add(cat);
  });

  const arr = Array.from(unique);
  if (gender === 'Mujer') {
    arr.sort((a, b) => b.localeCompare(a));
  } else {
    arr.sort((a, b) => {
      const wA = hombreCategoryOrder[a] || 99;
      const wB = hombreCategoryOrder[b] || 99;
      return wA !== wB ? wA - wB : a.localeCompare(b);
    });
  }
  return arr;
}

/**
 * Tallas "sin talla real" (talla única) como "S/T", "TALLA UNICA", etc.
 * Cuando un producto solo tiene una de estas como única variante de talla,
 * no tiene sentido mostrar un selector — se trata como si no tuviera tallas.
 */
const SINGLE_SIZE_TOKENS = new Set(['ST', 'TALLAUNICA', 'UNICA', 'UNITALLA', 'UNISIZE', 'ONESIZE']);

export function isSingleSizeLabel(size: string): boolean {
  const normalized = size.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return SINGLE_SIZE_TOKENS.has(normalized);
}

/** Talla para mostrarle al cliente: oculta marcadores de talla única (S/T, etc). */
export function displaySize(size: string | undefined | null): string {
  if (!size || isSingleSizeLabel(size)) return 'Única';
  return size;
}

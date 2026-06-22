// Helpers para URLs de producto legibles: /product/{slug-del-nombre}-{id}
//
// El ID de Firestore (20 caracteres alfanuméricos, sin guiones) queda al
// final, así que siempre podemos recuperarlo tomando lo que está después del
// último guion. Las URLs viejas /product/{id} (sin guion) siguen funcionando.

// Convierte "Camisa Oxford Azul" -> "camisa-oxford-azul"
export function slugify(name: string): string {
  return (name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quitar acentos
    .replace(/[^a-z0-9]+/g, '-') // todo lo no alfanumérico -> guion
    .replace(/^-+|-+$/g, ''); // quitar guiones al inicio/fin
}

// Construye el href legible de un producto
export function productHref(product: { id: string; name?: string }): string {
  const slug = slugify(product.name || '');
  return slug ? `/product/${slug}-${product.id}` : `/product/${product.id}`;
}

// Extrae el ID real de Firestore desde el parámetro de la URL.
// Acepta tanto el formato nuevo ("camisa-oxford-1eSkRqTv") como el viejo ("1eSkRqTv").
export function extractProductId(param: string): string {
  const decoded = decodeURIComponent(param || '');
  const idx = decoded.lastIndexOf('-');
  return idx === -1 ? decoded : decoded.slice(idx + 1);
}

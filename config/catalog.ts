// Product IDs to exclude from display
export const blacklistedProductIds = new Set([
  '25ATMO0j9D1cnnAVUdCU',
  'ErjzpOXhRzulV0FrmvjZ',
  'H6rfaRowA6W6LU4RT3Bi',
  'J4lvEQWgeM7eSqBosZbK',
  'ONjjex380HEeERE7NFBa',
  'OsYZNYZhXsr6ohBGIzNJ',
  'PdtuvYVxTW0FiC2bsedm',
  'QT3ojCtg9aZm2mIJTnBs',
  'WSBMrLvcYmZXrHw5j1bo',
  'c4AfpX4d5lWQE9TPq2pb',
  'd77VzxMOKYATtqVp8TsU',
  'eNTOPb9lori0JrABimK3',
  'mIEQXA4K0zwA8QRAGlwV',
  't2YdEo8m2n2GCbppZt1I',
  'vzCxUCAAzqa6HAs6oaOj',
  'EYcF7XdAaDRpwjK0eM92',
]);

// Category names to exclude
export const blacklistedCategories = new Set([
  'PANTALONES DE VESTIR',
  'PANTALONES DE CUERO',
]);

// Custom category sort order for "Hombre"
export const hombreCategoryOrder: Record<string, number> = {
  PANTALONES: 1,
  CAMISAS: 2,
  'CHAQUETA MEN': 3,
  CHAQUETA: 3,
  ACCESORIOS: 4,
};

// Category descriptions (shown when a category is selected)
export const categoryDescriptions: Record<string, string> = {
  // Hombre
  PANTALONES: 'Explora nuestra colección de pantalones cargo, joggers y más. Diseñados para el día a día con estilo urbano.',
  CAMISAS: 'Camisas, franelas y t-shirts con diseños exclusivos. Streetwear de alta calidad para cada ocasión.',
  'CHAQUETA MEN': 'Chaquetas y outerwear con cortes modernos. Perfectas para complementar cualquier look.',
  CHAQUETA: 'Chaquetas y outerwear con cortes modernos. Perfectas para complementar cualquier look.',
  ACCESORIOS: 'Complementa tu outfit con nuestros accesorios exclusivos.',
  // Mujer
  'PANTALONES MUJER': 'Pantalones con cortes que estilizan y telas de alta calidad. Del casual al elegante en un solo guardarropa.',
  'CONJUNTOS': 'Sets coordinados listos para usar. Estilo completo en una sola compra.',
  'BODIES': 'Bodies y tops con siluetas modernas. Diseñados para resaltar tu figura.',
  'FALDAS': 'Faldas con cortes únicos y telas premium para cada ocasión.',
  'CORSET': 'Corsets y tops estructurados con un toque contemporáneo.',
  'VESTIDOS': 'Vestidos para cada momento. Desde lo casual hasta lo especial.',
  'BLUSAS': 'Blusas con diseños frescos y femeninos. Versatilidad en cada prenda.',
  'CHAQUETA MUJER': 'Chaquetas y outerwear femenino. El toque final de cada look.',
  // General
  'BÁSICOS': 'Piezas esenciales que nunca pasan de moda. La base de todo buen guardarropa.',
};

// Size guide image mapping
export function getSizeGuideImage(category: string, gender: string): string | null {
  const cat = category.toUpperCase();
  const gen = gender.toUpperCase();

  if (cat.includes('PANTALON')) {
    return gen === 'MUJER'
      ? '/images/TALLASPANTALONMUJER.jpeg'
      : '/images/TALLASPANTALON.jpeg';
  }
  if (cat.includes('CAMISA') || cat.includes('CHAQUETA') || cat.includes('FRANELA')) {
    return gen === 'MUJER'
      ? '/images/TALLASCAMISAMUJER.jpeg'
      : '/images/TALLASCAMISA.jpeg';
  }
  return null;
}

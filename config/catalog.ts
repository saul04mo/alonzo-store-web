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

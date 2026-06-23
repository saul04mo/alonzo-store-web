'use client';

interface CategoryNotFoundProps {
  displayName: string;
  gender: string;
  categories: string[];
  onSelectCategory: (cat: string) => void;
  onGoToFirst: () => void;
  onViewAll: () => void;
}

/**
 * Estado "categoría pedida en la URL no existe". En vez de redirigir en
 * silencio a otra categoría (lo que confundía al cliente), mostramos un
 * 404 claro con la categoría escrita y CTAs hacia categorías válidas.
 */
export function CategoryNotFound({
  displayName,
  gender,
  categories,
  onSelectCategory,
  onGoToFirst,
  onViewAll,
}: CategoryNotFoundProps) {
  return (
    <div className="px-4 md:px-6 lg:px-10 py-12 md:py-20 max-w-3xl mx-auto text-center">
      <p className="text-[10px] md:text-xs font-sans tracking-[0.3em] uppercase text-alonzo-gray-400 mb-3">
        404 · Categoría
      </p>
      <h2 className="font-editorial text-3xl md:text-5xl uppercase tracking-wide text-alonzo-charcoal leading-[1.05] mb-4">
        "{displayName}" no encontrada
      </h2>
      <p className="text-sm md:text-base text-alonzo-gray-600 leading-relaxed max-w-md mx-auto mb-8">
        No hay productos en esta categoría para {gender}. Probá con una
        de las categorías disponibles o explorá toda la colección.
      </p>

      {/* Chips clickeables con las categorías reales del género actual */}
      {categories.length > 0 && (
        <div className="mb-8">
          <p className="text-[10px] font-sans tracking-[0.25em] uppercase text-alonzo-gray-500 mb-3">
            Categorías disponibles
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className="px-4 py-2 text-xs font-sans tracking-wider uppercase border border-alonzo-gray-300 text-alonzo-charcoal hover:bg-alonzo-black hover:text-white hover:border-alonzo-black transition-colors"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
        <button
          onClick={onGoToFirst}
          className="px-8 py-3 bg-alonzo-black text-white text-xs font-sans font-semibold tracking-[0.15em] uppercase hover:bg-alonzo-gray-800 transition-colors"
        >
          Ver {categories[0] || 'productos'}
        </button>
        <button
          onClick={onViewAll}
          className="px-8 py-3 bg-transparent text-alonzo-charcoal text-xs font-sans font-semibold tracking-[0.15em] uppercase border border-alonzo-charcoal hover:bg-alonzo-charcoal hover:text-white transition-colors"
        >
          Ver toda la colección
        </button>
      </div>
    </div>
  );
}

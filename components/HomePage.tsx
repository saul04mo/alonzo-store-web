'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ProductGrid } from '@/components/products/ProductGrid';
import { PromotionsBanner } from '@/components/products/PromotionsBanner';
import { HeroBanner } from '@/components/ui';
import { fetchProducts, seedProduct } from '@/lib/api';
import { hombreCategoryOrder, categoryDescriptions } from '@/config';
import { useUIStore } from '@/stores';
import { SlidersHorizontal } from 'lucide-react';
import { FilterDrawer, applyFilters, extractSizes, defaultFilters } from '@/components/ui/FilterDrawer';
import type { FilterState } from '@/components/ui/FilterDrawer';
import type { Product, Gender } from '@/types';

type GridCols = 1 | 2 | 3 | 4;

interface HomePageProps {
  initialHeroImages?: string[];
  initialHeroImagesMobile?: string[];
  initialHeroSubtitle?: string;
  initialHeroSlideInterval?: number;
}

export function HomePage({ initialHeroImages, initialHeroImagesMobile, initialHeroSubtitle, initialHeroSlideInterval }: HomePageProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [gridCols, setGridCols] = useState<GridCols>(4);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const gender = useUIStore((s) => s.gender);
  const setGender = useUIStore((s) => s.setGender);
  const searchTerm = useUIStore((s) => s.searchTerm);
  const setSearchTerm = useUIStore((s) => s.setSearchTerm);
  const activeCategory = useUIStore((s) => s.activeCategory);
  const setActiveCategory = useUIStore((s) => s.setActiveCategory);
  const setCategoriesForGender = useUIStore((s) => s.setCategoriesForGender);
  const hasBrowsed = useUIStore((s) => s.hasBrowsed);
  const setHasBrowsed = useUIStore((s) => s.setHasBrowsed);

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Sync state from URL (on mount + back/forward navigation)
  useEffect(() => {
    const urlGender = searchParams.get('gender');
    const urlCategory = searchParams.get('category');
    if (urlGender === 'Mujer' || urlGender === 'Hombre') {
      if (urlGender !== gender) setGender(urlGender as Gender);
    }
    if (urlCategory) {
      // Guardamos la categoría tal como viene en la URL — la validación
      // contra las categorías reales del catálogo ocurre en el efecto
      // de auto-fix de abajo, una vez que los productos cargaron.
      const cat = urlCategory.trim().toUpperCase();
      if (cat !== activeCategory) setActiveCategory(cat);
      if (!hasBrowsed) setHasBrowsed(true);
    } else if (hasBrowsed && !urlCategory) {
      setHasBrowsed(false);
      setActiveCategory('');
    }
  }, [searchParams]);

  // Update URL when category changes.
  // Skip the first run after mount: en ese momento URL sync aún no propagó
  // sus setters, así que el closure tiene hasBrowsed=false aunque la URL
  // sí traiga ?category=... Sin este guard se llamaba router.push('/') y
  // se perdían los params al entrar directo con un link compartido.
  const urlUpdateInitializedRef = useRef(false);
  useEffect(() => {
    if (!mounted) return;
    if (!urlUpdateInitializedRef.current) {
      urlUpdateInitializedRef.current = true;
      return;
    }
    const params = new URLSearchParams();
    if (hasBrowsed && activeCategory) {
      params.set('gender', gender);
      params.set('category', activeCategory);
      const newUrl = `/?${params.toString()}`;
      // Only push if URL actually changed
      if (window.location.search !== `?${params.toString()}`) {
        router.push(newUrl, { scroll: false });
      }
    } else if (!hasBrowsed && window.location.search) {
      router.push('/', { scroll: false });
    }
  }, [activeCategory, hasBrowsed, gender, mounted]);

  // Load products — race-safe con flag 'cancelled' para evitar que un
  // fetch viejo pise el state si gender cambió mientras estaba en curso.
  //
  // Bug que arreglábamos: al entrar directo a /?gender=Mujer&category=BLAZER,
  // si el store tenía gender='Hombre' (default), el primer mount disparaba
  // fetchProducts('Hombre'). Inmediatamente después el URL sync seteaba
  // gender='Mujer' y disparaba fetchProducts('Mujer') en paralelo. Si el
  // de Hombre terminaba primero, setea products con catálogo Hombre,
  // categories se calculaba SIN 'BLAZER', y el auto-fix lo cambiaba a
  // la primera categoría disponible (ej. PANTALONES). Como PANTALONES
  // también existe en Mujer, cuando llegaba el fetch Mujer NO se
  // corregía → el usuario terminaba en PANTALONES en vez de BLAZER.
  //
  // Fix: el cleanup del efecto setea cancelled=true. Cualquier fetch en
  // curso ignora su resultado cuando resuelve. Sólo el fetch del último
  // gender escribe en el state.
  //
  // También quité el 'setActiveCategory(\'\')' que estaba acá: el URL sync
  // ya maneja ese caso de forma más coherente.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setProducts([]);
    fetchProducts(gender)
      .then((data) => {
        if (cancelled) return;
        setProducts(data);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error(err);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [gender]);

  // Categories
  const categories = useMemo(() => {
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
  }, [products, gender]);

  // Store categories in UI store for the header nav.
  // Solo actualizamos cuando los productos ya son del género actual —
  // evita que en el render intermedio (gender cambió pero products
  // todavía tiene datos del género anterior) se guarden categorías
  // del género equivocado bajo la nueva clave.
  useEffect(() => {
    if (categories.length > 0 && products.length > 0 && products[0].gender === gender) {
      setCategoriesForGender(gender, categories);
    }
  }, [categories, gender, products]);

  // Auto-select first category
  useEffect(() => {
    if (categories.length > 0 && !activeCategory) {
      setActiveCategory(categories[0]);
    }
  }, [categories, activeCategory]);

  // ── Detección de "categoría no encontrada" ─────────────────────────
  //
  // Antes acá había un useEffect que, si activeCategory no estaba en
  // las categorías disponibles, hacía setActiveCategory(categories[0])
  // — auto-redirigía silenciosamente. El feedback del cliente fue:
  // 'si la URL pide una categoría que no tengo, debería decir como no
  // encontrado o algo alusivo' (en lugar de irse silenciosamente a
  // otra categoría sin avisar).
  //
  // Por eso ahora calculamos un flag isCategoryNotFound y el render
  // muestra un estado claro de 'no encontrada' con CTAs. La URL se
  // mantiene, así el usuario puede ver qué categoría escribió mal.
  const isCategoryNotFound =
    !loading &&
    hasBrowsed &&
    !!activeCategory &&
    categories.length > 0 &&
    !categories.includes(activeCategory);

  // Base products (after category/search, before filter drawer)
  const baseProducts = useMemo(() => {
    if (searchTerm.trim()) {
      const term = searchTerm.toUpperCase();
      return products.filter((p) => p.name.toUpperCase().includes(term));
    }
    if (hasBrowsed && activeCategory) {
      return products.filter((p) => p.category.trim().toUpperCase() === activeCategory);
    }
    return products;
  }, [products, activeCategory, searchTerm, hasBrowsed]);

  // Final filtered (with filter drawer applied)
  const filteredProducts = useMemo(() => applyFilters(baseProducts, filters), [baseProducts, filters]);

  // Available sizes for filter drawer
  const availableSizes = useMemo(() => extractSizes(baseProducts), [baseProducts]);

  const handleProductClick = useCallback(
    (product: Product) => {
      seedProduct(product);
      router.push(`/product/${product.id}`);
    },
    [router]
  );

  // Handler para el CTA del estado 'categoría no encontrada': lleva al
  // usuario a la primera categoría disponible del género actual.
  const handleGoToFirstCategory = useCallback(() => {
    if (categories.length > 0) {
      setActiveCategory(categories[0]);
    }
  }, [categories, setActiveCategory]);

  // Handler alternativo: ver todos los productos del género (limpia
  // categoría activa y hace que se muestre la home con el hero).
  const handleViewAllProducts = useCallback(() => {
    setActiveCategory('');
    setHasBrowsed(false);
  }, [setActiveCategory, setHasBrowsed]);

  // Category display name (capitalize first letter of each word)
  const categoryDisplayName = useMemo(() => {
    if (!activeCategory) return '';
    return activeCategory
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }, [activeCategory]);

  const categoryDescription = useMemo(() => {
    if (!activeCategory) return '';
    // Exact match first
    if (categoryDescriptions[activeCategory]) return categoryDescriptions[activeCategory];
    // Partial match (e.g. "PANTALONES MUJER" matches "PANTALONES")
    const key = Object.keys(categoryDescriptions).find((k) => activeCategory.includes(k) || k.includes(activeCategory));
    return key ? categoryDescriptions[key] : '';
  }, [activeCategory]);
  const showHero = !hasBrowsed && !searchTerm;

  if (!mounted) return <div className="min-h-screen bg-white" />;

  return (
    <>
      {showHero && (
        <HeroBanner
          initialHeroImages={initialHeroImages}
          initialHeroImagesMobile={initialHeroImagesMobile}
          initialHeroSubtitle={initialHeroSubtitle}
          initialHeroSlideInterval={initialHeroSlideInterval}
        />
      )}

      <div id="products-section" className={`${hasBrowsed ? 'py-4 md:py-6' : 'py-6 md:py-10'}`}>
        {/* Category header (shown when browsing a category — pero ocultamos
            cuando la categoría es inválida porque el estado 404 más abajo
            ya muestra el nombre de la categoría con mejor jerarquía). */}
        {hasBrowsed && activeCategory && !searchTerm && !isCategoryNotFound && (
          <div key={activeCategory} className="px-4 md:px-6 lg:px-10 mb-8 md:mb-12 pt-4 md:pt-6 page-fade-in">
            {/* Title + count */}
            <h1 className="text-xl md:text-3xl font-semibold text-alonzo-charcoal tracking-wide mb-3 md:mb-5">
              {categoryDisplayName}
              <span className="text-alonzo-gray-400 font-normal text-base md:text-xl ml-2 md:ml-3">
                {filteredProducts.length}
              </span>
            </h1>

            {/* Description */}
            {categoryDescription && (
              <p className="text-xs md:text-sm text-alonzo-gray-500 max-w-2xl mb-6 md:mb-10 leading-relaxed">
                {categoryDescription}
              </p>
            )}

            {/* View toggle + Filter */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-alonzo-gray-500 mr-1">View</span>
                <button
                  onClick={() => setGridCols(1)}
                  className={`p-1.5 rounded transition-colors sm:hidden ${gridCols === 1 ? 'text-alonzo-black' : 'text-alonzo-gray-300 hover:text-alonzo-gray-600'}`}
                  title="1 columna"
                >
                  <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="3" y="1" width="10" height="6" rx="1"/>
                    <rect x="3" y="9" width="10" height="6" rx="1"/>
                  </svg>
                </button>
                <button
                  onClick={() => setGridCols(2)}
                  className={`p-1.5 rounded transition-colors ${gridCols === 2 ? 'text-alonzo-black' : 'text-alonzo-gray-300 hover:text-alonzo-gray-600'}`}
                  title="2 columnas"
                >
                  <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
                    <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
                  </svg>
                </button>
                <button
                  onClick={() => setGridCols(3)}
                  className={`p-1.5 rounded transition-colors hidden sm:flex ${gridCols === 3 ? 'text-alonzo-black' : 'text-alonzo-gray-300 hover:text-alonzo-gray-600'}`}
                  title="3 columnas"
                >
                  <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="1" y="1" width="4" height="6" rx="0.5"/><rect x="6" y="1" width="4" height="6" rx="0.5"/><rect x="11" y="1" width="4" height="6" rx="0.5"/>
                    <rect x="1" y="9" width="4" height="6" rx="0.5"/><rect x="6" y="9" width="4" height="6" rx="0.5"/><rect x="11" y="9" width="4" height="6" rx="0.5"/>
                  </svg>
                </button>
                <button
                  onClick={() => setGridCols(4)}
                  className={`p-1.5 rounded transition-colors hidden md:flex ${gridCols === 4 ? 'text-alonzo-black' : 'text-alonzo-gray-300 hover:text-alonzo-gray-600'}`}
                  title="4 columnas"
                >
                  <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
                    <rect x="1" y="1" width="3" height="6" rx="0.5"/><rect x="5" y="1" width="3" height="6" rx="0.5"/>
                    <rect x="9" y="1" width="3" height="6" rx="0.5"/><rect x="13" y="1" width="3" height="6" rx="0.5"/>
                    <rect x="1" y="9" width="3" height="6" rx="0.5"/><rect x="5" y="9" width="3" height="6" rx="0.5"/>
                    <rect x="9" y="9" width="3" height="6" rx="0.5"/><rect x="13" y="9" width="3" height="6" rx="0.5"/>
                  </svg>
                </button>
              </div>
              <button
                onClick={() => setFilterOpen(true)}
                className="flex items-center gap-2 text-sm text-alonzo-gray-600 hover:text-alonzo-black transition-colors relative"
              >
                <span>Filter</span>
                <SlidersHorizontal size={20} />
                {(filters.sortBy !== 'default' || filters.sizes.length > 0 || filters.onSale) && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-alonzo-black rounded-full" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Search results title */}
        {searchTerm && (
          <div className="px-4 md:px-6 lg:px-8 mb-6">
            <h1 className="text-lg font-semibold text-alonzo-charcoal">
              Resultados para "{searchTerm}"
              <span className="text-alonzo-gray-400 font-normal text-sm ml-2">{filteredProducts.length}</span>
            </h1>
          </div>
        )}

        <PromotionsBanner />

        {/* ── Estado: categoría pedida en la URL no existe ─────────── */}
        {isCategoryNotFound ? (
          <div className="px-4 md:px-6 lg:px-10 py-12 md:py-20 max-w-3xl mx-auto text-center">
            <p className="text-[10px] md:text-xs font-sans tracking-[0.3em] uppercase text-alonzo-gray-400 mb-3">
              404 · Categoría
            </p>
            <h2 className="font-editorial text-3xl md:text-5xl uppercase tracking-wide text-alonzo-charcoal leading-[1.05] mb-4">
              "{categoryDisplayName}" no encontrada
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
                      onClick={() => setActiveCategory(cat)}
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
                onClick={handleGoToFirstCategory}
                className="px-8 py-3 bg-alonzo-black text-white text-xs font-sans font-semibold tracking-[0.15em] uppercase hover:bg-alonzo-gray-800 transition-colors"
              >
                Ver {categories[0] || 'productos'}
              </button>
              <button
                onClick={handleViewAllProducts}
                className="px-8 py-3 bg-transparent text-alonzo-charcoal text-xs font-sans font-semibold tracking-[0.15em] uppercase border border-alonzo-charcoal hover:bg-alonzo-charcoal hover:text-white transition-colors"
              >
                Ver toda la colección
              </button>
            </div>
          </div>
        ) : (
          <ProductGrid
            products={filteredProducts}
            loading={loading}
            onProductClick={handleProductClick}
            sectionTitle={!hasBrowsed && !searchTerm ? (gender === 'Mujer' ? 'Moda para mujer' : 'Moda para hombre') : undefined}
            gridCols={hasBrowsed ? gridCols : undefined}
          />
        )}
      </div>

      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onApply={setFilters}
        availableSizes={availableSizes}
        products={baseProducts}
      />
    </>
  );
}

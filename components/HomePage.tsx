'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProductGrid } from '@/components/products/ProductGrid';
import { PromotionsBanner } from '@/components/products/PromotionsBanner';
import { CategoryHeader } from '@/components/products/CategoryHeader';
import { CategoryNotFound } from '@/components/products/CategoryNotFound';
import { HeroBanner } from '@/components/ui';
import { seedProduct } from '@/lib/api';
import { productHref } from '@/lib/productUrl';
import { categoryDescriptions } from '@/config';
import { useCatalog } from '@/lib/useCatalog';
import { useCatalogUrlState } from '@/lib/useCatalogUrlState';
import { useScrollDepth } from '@/lib/useScrollDepth';
import { trackEvent } from '@/lib/analytics';
import { useUIStore } from '@/stores';
import { FilterDrawer, applyFilters, extractSizes, extractSubcategories, defaultFilters } from '@/components/ui/FilterDrawer';
import type { FilterState } from '@/components/ui/FilterDrawer';
import type { Product, Gender } from '@/types';

type GridCols = 1 | 2 | 3 | 4;

interface HomePageProps {
  initialProducts?: Product[];
  initialGender?: Gender;
  initialHeroImages?: string[];
  initialHeroImagesMobile?: string[];
  initialHeroSubtitle?: string;
  initialHeroSlideInterval?: number;
}

export function HomePage({
  initialProducts = [],
  initialGender = 'Hombre',
  initialHeroImages,
  initialHeroImagesMobile,
  initialHeroSubtitle,
  initialHeroSlideInterval,
}: HomePageProps = {}) {
  const router = useRouter();

  // Hooks de catálogo. Orden importante: el sync de URL va primero (define
  // sus efectos antes que los de carga de datos), igual que en el original.
  const { mounted } = useCatalogUrlState();
  const { products, loading, categories } = useCatalog(initialProducts, initialGender);

  // Estado de navegación (en el store) que la home solo lee / ajusta.
  const gender = useUIStore((s) => s.gender);
  const searchTerm = useUIStore((s) => s.searchTerm);
  const activeCategory = useUIStore((s) => s.activeCategory);
  const setActiveCategory = useUIStore((s) => s.setActiveCategory);
  const hasBrowsed = useUIStore((s) => s.hasBrowsed);
  const setHasBrowsed = useUIStore((s) => s.setHasBrowsed);

  // Estado local de presentación.
  const [gridCols, setGridCols] = useState<GridCols>(4);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  // ── Estado "categoría no encontrada" ───────────────────────────────
  // Si la URL pide una categoría que no existe en el género actual,
  // mostramos un 404 claro (en vez de redirigir en silencio).
  const isCategoryNotFound =
    !loading &&
    hasBrowsed &&
    !!activeCategory &&
    categories.length > 0 &&
    !categories.includes(activeCategory);

  // Productos tras categoría/búsqueda (antes del filter drawer).
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

  const filteredProducts = useMemo(() => applyFilters(baseProducts, filters), [baseProducts, filters]);
  const availableSizes = useMemo(() => extractSizes(baseProducts), [baseProducts]);
  const availableSubcategories = useMemo(() => extractSubcategories(baseProducts), [baseProducts]);

  // El filtro de "Tipo" es específico de cada categoría (Cargo/Corte Recto
  // solo existen dentro de Pantalones) — al cambiar de categoría, uno que
  // haya quedado seleccionado ya no aplica a ningún producto.
  useEffect(() => {
    setFilters((f) => (f.subcategory ? { ...f, subcategory: null } : f));
  }, [activeCategory]);

  const handleSelectSubcategory = useCallback((sub: string | null) => {
    setFilters((f) => ({ ...f, subcategory: sub }));
    if (sub) void trackEvent('select_subcategory', { subcategory: sub });
  }, []);

  // Los filtros son estado local (no tocan la URL), así que sin este evento no
  // hay forma de saber si la gente los usa. Van como evento y NO como page_view:
  // registrarlos como vistas volvería a inflar el reporte de páginas.
  const handleApplyFilters = useCallback((next: FilterState) => {
    setFilters(next);
    void trackEvent('apply_filters', {
      sort_by: next.sortBy,
      sizes: next.sizes.join(',') || 'none',
      size_count: next.sizes.length,
      on_sale: next.onSale,
      subcategory: next.subcategory ?? 'none',
    });
  }, []);

  const handleProductClick = useCallback(
    (product: Product) => {
      seedProduct(product);
      router.push(productHref(product));
    },
    [router]
  );

  // CTA del 404: ir a la primera categoría disponible del género.
  const handleGoToFirstCategory = useCallback(() => {
    if (categories.length > 0) setActiveCategory(categories[0]);
  }, [categories, setActiveCategory]);

  // CTA alternativo: ver todo el género (vuelve a la home con hero).
  const handleViewAllProducts = useCallback(() => {
    setActiveCategory('');
    setHasBrowsed(false);
  }, [setActiveCategory, setHasBrowsed]);

  // Nombre legible de la categoría (Title Case).
  const categoryDisplayName = useMemo(() => {
    if (!activeCategory) return '';
    return activeCategory
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }, [activeCategory]);

  const categoryDescription = useMemo(() => {
    if (!activeCategory) return '';
    if (categoryDescriptions[activeCategory]) return categoryDescriptions[activeCategory];
    // Partial match (e.g. "PANTALONES MUJER" matches "PANTALONES")
    const key = Object.keys(categoryDescriptions).find((k) => activeCategory.includes(k) || k.includes(activeCategory));
    return key ? categoryDescriptions[key] : '';
  }, [activeCategory]);

  const showHero = !hasBrowsed && !searchTerm;

  // Contexto del scroll: qué estaba mirando el visitante al scrollear. Sin esto
  // no se puede separar "rebotó en el hero" de "recorrió la grilla entera".
  const scrollContext = searchTerm
    ? 'search'
    : hasBrowsed && activeCategory
      ? `category:${activeCategory}`
      : `home:${gender}`;
  useScrollDepth(scrollContext);
  const filtersActive = filters.sortBy !== 'default' || filters.sizes.length > 0 || filters.onSale || !!filters.subcategory;

  // Acción de salida del empty state: si hay filtros activos, limpiarlos;
  // si no, volver a ver todo (sale del callejón "Sin resultados").
  const emptyAction = filtersActive
    ? { label: 'Limpiar filtros', onClick: () => setFilters(defaultFilters) }
    : { label: 'Ver todo', onClick: handleViewAllProducts };

  // SSR: la home depende de estado persistido en el cliente.
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
        {/* Encabezado de categoría — oculto en el estado 404 (ese muestra
            el nombre de la categoría con mejor jerarquía). */}
        {hasBrowsed && activeCategory && !searchTerm && !isCategoryNotFound && (
          <CategoryHeader
            key={activeCategory}
            displayName={categoryDisplayName}
            description={categoryDescription}
            count={filteredProducts.length}
            gridCols={gridCols}
            onGridColsChange={setGridCols}
            onOpenFilter={() => setFilterOpen(true)}
            filtersActive={filtersActive}
            availableSubcategories={availableSubcategories}
            activeSubcategory={filters.subcategory}
            onSelectSubcategory={handleSelectSubcategory}
          />
        )}

        {/* Título de resultados de búsqueda */}
        {searchTerm && (
          <div className="px-4 md:px-6 lg:px-8 mb-6">
            <h1 className="text-lg font-semibold text-alonzo-charcoal">
              Resultados para "{searchTerm}"
              <span className="text-alonzo-gray-600 font-normal text-sm ml-2">{filteredProducts.length}</span>
            </h1>
          </div>
        )}

        <PromotionsBanner />

        {isCategoryNotFound ? (
          <CategoryNotFound
            displayName={categoryDisplayName}
            gender={gender}
            categories={categories}
            onSelectCategory={setActiveCategory}
            onGoToFirst={handleGoToFirstCategory}
            onViewAll={handleViewAllProducts}
          />
        ) : (
          <ProductGrid
            products={filteredProducts}
            loading={loading}
            onProductClick={handleProductClick}
            sectionTitle={!hasBrowsed && !searchTerm ? (gender === 'Mujer' ? 'Moda para mujer' : 'Moda para hombre') : undefined}
            gridCols={hasBrowsed ? gridCols : undefined}
            emptyAction={emptyAction}
          />
        )}
      </div>

      <FilterDrawer
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        filters={filters}
        onApply={handleApplyFilters}
        availableSizes={availableSizes}
        products={baseProducts}
      />
    </>
  );
}

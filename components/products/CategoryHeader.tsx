'use client';
import { SlidersHorizontal } from 'lucide-react';

type GridCols = 1 | 2 | 3 | 4;

interface CategoryHeaderProps {
  displayName: string;
  description: string;
  count: number;
  gridCols: GridCols;
  onGridColsChange: (cols: GridCols) => void;
  onOpenFilter: () => void;
  filtersActive: boolean;
}

/**
 * Encabezado de una categoría: título + conteo + descripción + selector
 * de columnas (view toggle) + botón de filtros. Antes vivía inline dentro
 * de HomePage; extraído para que HomePage quede legible.
 */
export function CategoryHeader({
  displayName,
  description,
  count,
  gridCols,
  onGridColsChange,
  onOpenFilter,
  filtersActive,
}: CategoryHeaderProps) {
  return (
    <div className="px-4 md:px-6 lg:px-10 mb-8 md:mb-12 pt-4 md:pt-6 page-fade-in">
      {/* Title + count */}
      <h1 className="text-xl md:text-3xl font-semibold text-alonzo-charcoal tracking-wide mb-3 md:mb-5">
        {displayName}
        <span className="text-alonzo-gray-600 font-normal text-base md:text-xl ml-2 md:ml-3">
          {count}
        </span>
      </h1>

      {/* Description */}
      {description && (
        <p className="text-xs md:text-sm text-alonzo-gray-600 max-w-2xl mb-6 md:mb-10 leading-relaxed">
          {description}
        </p>
      )}

      {/* View toggle + Filter */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-alonzo-gray-600 mr-1">Ver</span>
          <button
            onClick={() => onGridColsChange(1)}
            className={`p-1.5 rounded transition-colors sm:hidden ${gridCols === 1 ? 'text-alonzo-black' : 'text-alonzo-gray-500 hover:text-alonzo-black'}`}
            title="1 columna"
          >
            <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
              <rect x="3" y="1" width="10" height="6" rx="1"/>
              <rect x="3" y="9" width="10" height="6" rx="1"/>
            </svg>
          </button>
          <button
            onClick={() => onGridColsChange(2)}
            className={`p-1.5 rounded transition-colors ${gridCols === 2 ? 'text-alonzo-black' : 'text-alonzo-gray-500 hover:text-alonzo-black'}`}
            title="2 columnas"
          >
            <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/>
              <rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/>
            </svg>
          </button>
          <button
            onClick={() => onGridColsChange(3)}
            className={`p-1.5 rounded transition-colors hidden sm:flex ${gridCols === 3 ? 'text-alonzo-black' : 'text-alonzo-gray-500 hover:text-alonzo-black'}`}
            title="3 columnas"
          >
            <svg width="22" height="22" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1" width="4" height="6" rx="0.5"/><rect x="6" y="1" width="4" height="6" rx="0.5"/><rect x="11" y="1" width="4" height="6" rx="0.5"/>
              <rect x="1" y="9" width="4" height="6" rx="0.5"/><rect x="6" y="9" width="4" height="6" rx="0.5"/><rect x="11" y="9" width="4" height="6" rx="0.5"/>
            </svg>
          </button>
          <button
            onClick={() => onGridColsChange(4)}
            className={`p-1.5 rounded transition-colors hidden md:flex ${gridCols === 4 ? 'text-alonzo-black' : 'text-alonzo-gray-500 hover:text-alonzo-black'}`}
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
          onClick={onOpenFilter}
          className="flex items-center gap-2 text-sm text-alonzo-gray-600 hover:text-alonzo-black transition-colors relative"
        >
          <span>Filtrar</span>
          <SlidersHorizontal size={20} />
          {filtersActive && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-alonzo-black rounded-full" />
          )}
        </button>
      </div>
    </div>
  );
}

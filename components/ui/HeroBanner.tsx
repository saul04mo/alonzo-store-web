'use client';
import { useCallback, useState } from 'react';
import Image from 'next/image';
import { useUIStore } from '@/stores';
import { useWebSettings } from '@/lib/useWebSettings';

interface HeroBannerProps {
  /**
   * Valores SSR-prerendered de heroImage y heroSubtitle. Si se proveen,
   * el primer render usa estos en lugar de los DEFAULTS hardcoded del
   * hook. Esto elimina el flash al hacer F5: el HTML ya viene con la
   * URL correcta desde el server, y el onSnapshot del hook solo
   * actualiza si algo cambia después.
   */
  initialHeroImage?: string;
  initialHeroSubtitle?: string;
}

export function HeroBanner({ initialHeroImage, initialHeroSubtitle }: HeroBannerProps = {}) {
  const setHasBrowsed = useUIStore((s) => s.setHasBrowsed);
  const setActiveCategory = useUIStore((s) => s.setActiveCategory);
  const settings = useWebSettings();

  // Preferencia: si hay valor SSR, usar ese primero. Si no, lo que
  // diga el hook (que arranca con DEFAULTS y se actualiza al recibir
  // el primer snapshot). Una vez que el hook tiene 'loaded === true',
  // su valor es la fuente de verdad — por si el admin cambió algo en
  // el POS mientras la página estaba abierta.
  const heroImage = settings.loaded ? settings.heroImage : (initialHeroImage || settings.heroImage);
  const heroSubtitle = settings.loaded ? settings.heroSubtitle : (initialHeroSubtitle || settings.heroSubtitle);

  const [imageLoaded, setImageLoaded] = useState(false);

  // Handler único: hace scroll a la sección de productos sin filtrar
  // por género. El usuario navega después con los filtros del shop.
  const handleShop = useCallback(() => {
    setHasBrowsed(true);
    setActiveCategory('');
    const productsEl = document.getElementById('products-section');
    if (productsEl) {
      productsEl.scrollIntoView({ behavior: 'smooth' });
    }
  }, [setHasBrowsed, setActiveCategory]);

  const isExternal = heroImage.startsWith('http');

  return (
    <div className="relative w-full h-screen bg-alonzo-gray-100 overflow-hidden">
      {isExternal ? (
        <img
          src={heroImage}
          alt="Hero Banner"
          onLoad={() => setImageLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover object-top transition-all duration-1000 ease-out ${
            imageLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-md scale-[1.02]'
          }`}
        />
      ) : (
        <Image
          src={heroImage}
          alt="Hero Banner"
          fill
          priority
          sizes="100vw"
          onLoad={() => setImageLoaded(true)}
          className={`object-cover object-top transition-all duration-1000 ease-out ${
            imageLoaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-md scale-[1.02]'
          }`}
        />
      )}

      {/* Gradient sutil desde abajo-izquierda hacia transparente. Mejora
          la legibilidad del texto blanco sin oscurecer toda la imagen. */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-black/15 to-transparent pointer-events-none" />

      {/* ── Contenido del hero: solo texto y un botón ─────────────────
          Sin card / sin fondo oscuro. El texto va directamente sobre
          la imagen con drop-shadow para legibilidad y la tipografía
          editorial (Playfair Display) en el título grande.
      */}
      <div className="absolute z-10 bottom-12 left-4 right-4 md:bottom-20 md:left-12 md:right-auto md:max-w-[560px]">
        {/* Etiqueta superior pequeña, sans-serif con tracking ancho */}
        <p className="text-[10px] md:text-xs font-sans tracking-[0.3em] uppercase text-white font-medium mb-3 md:mb-4 drop-shadow-lg stagger-up stagger-1">
          New Arrivals
        </p>

        {/* Título principal grande — Bebas Neue condensada, editable desde POS.
            Bebas se ve mejor con tracking levemente abierto en uppercase
            grande, y leading apretado porque las letras son altas. */}
        <h2 className="font-editorial font-normal text-white text-5xl sm:text-6xl md:text-7xl lg:text-8xl uppercase tracking-wide leading-[0.9] mb-6 md:mb-8 drop-shadow-xl stagger-up stagger-2">
          {heroSubtitle}
        </h2>

        {/* Botón único — blanco sólido, estilo CTA editorial */}
        <button
          onClick={handleShop}
          className="inline-block px-10 md:px-14 py-3.5 md:py-4 bg-white text-alonzo-black text-[11px] md:text-xs font-sans font-semibold tracking-[0.2em] uppercase hover:bg-alonzo-black hover:text-white transition-colors duration-300 shadow-xl stagger-up stagger-3"
        >
          Shop Now
        </button>
      </div>
    </div>
  );
}

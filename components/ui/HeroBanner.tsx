'use client';
import { useCallback, useState } from 'react';
import Image from 'next/image';
import { useUIStore } from '@/stores';
import { useWebSettings } from '@/lib/useWebSettings';
import type { Gender } from '@/types';

export function HeroBanner() {
  const setGender = useUIStore((s) => s.setGender);
  const setHasBrowsed = useUIStore((s) => s.setHasBrowsed);
  const setActiveCategory = useUIStore((s) => s.setActiveCategory);
  const { heroTitle, heroSubtitle, heroImage } = useWebSettings();
  
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleGenderSelect = useCallback((g: Gender) => {
    setGender(g);
    setHasBrowsed(true);
    setActiveCategory('');
    
    const productsEl = document.getElementById('products-section');
    if (productsEl) {
      productsEl.scrollIntoView({ behavior: 'smooth' });
    }
  }, [setGender, setHasBrowsed, setActiveCategory]);

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

      {/* Overlay sutil para mejorar contraste de la card */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-transparent" />

      {/* ── Card de CTA abajo-izquierda ─────────────────────────────────
          Inspirado en el estilo Fear of God: bloque compacto con
          etiqueta pequeña arriba, título grande (usa heroSubtitle del
          POS), y botones de navegación al catálogo por género.

          En mobile la card queda más chica, centrada horizontalmente
          y un poco más arriba del borde inferior. En desktop se ancla
          abajo-izquierda con padding generoso.
      */}
      <div className="absolute z-10 bottom-6 left-4 right-4 md:bottom-12 md:left-10 md:right-auto md:max-w-[420px]">
        <div className="bg-black/75 backdrop-blur-md p-5 md:p-7 shadow-2xl stagger-up stagger-1">
          {/* Etiqueta superior */}
          <p className="text-[9px] md:text-[11px] font-sans tracking-[0.25em] uppercase text-white/70 mb-2 md:mb-3">
            New Arrivals
          </p>

          {/* Título principal (editable desde POS via heroSubtitle) */}
          <h2 className="text-2xl md:text-4xl font-display font-bold uppercase tracking-tight leading-[1.05] text-white mb-4 md:mb-6">
            {heroSubtitle}
          </h2>

          {/* Botones de género */}
          <div className="flex items-stretch gap-2 md:gap-3">
            <button
              onClick={() => handleGenderSelect('Mujer')}
              className="flex-1 py-3 md:py-3.5 px-4 bg-white text-alonzo-black text-[11px] md:text-xs font-sans tracking-[0.15em] uppercase font-semibold hover:bg-alonzo-black hover:text-white border border-white transition-colors duration-300"
            >
              Mujer
            </button>
            <button
              onClick={() => handleGenderSelect('Hombre')}
              className="flex-1 py-3 md:py-3.5 px-4 bg-transparent text-white text-[11px] md:text-xs font-sans tracking-[0.15em] uppercase font-semibold hover:bg-white hover:text-alonzo-black border border-white transition-colors duration-300"
            >
              Hombre
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

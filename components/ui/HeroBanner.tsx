'use client';
import { useCallback, useState, useEffect, useRef } from 'react';
import { useUIStore } from '@/stores';
import { useWebSettings } from '@/lib/useWebSettings';

interface HeroBannerProps {
  initialHeroImages?: string[];
  initialHeroImagesMobile?: string[];
  initialHeroSubtitle?: string;
  initialHeroSlideInterval?: number;
}

export function HeroBanner({
  initialHeroImages,
  initialHeroImagesMobile,
  initialHeroSubtitle,
  initialHeroSlideInterval,
}: HeroBannerProps = {}) {
  const setHasBrowsed = useUIStore((s) => s.setHasBrowsed);
  const setActiveCategory = useUIStore((s) => s.setActiveCategory);
  const settings = useWebSettings();

  const heroImages = settings.loaded ? settings.heroImages : (initialHeroImages ?? undefined);
  const heroSubtitle = settings.loaded
    ? settings.heroSubtitle
    : (initialHeroSubtitle || settings.heroSubtitle);
  const slideInterval = settings.loaded
    ? settings.heroSlideInterval
    : (initialHeroSlideInterval ?? 6);

  // Imágenes móvil: si no hay array móvil, usa el de desktop
  const heroImagesMobile = settings.loaded
    ? (settings.heroImagesMobile.length ? settings.heroImagesMobile : settings.heroImages)
    : (initialHeroImagesMobile?.length ? initialHeroImagesMobile : heroImages);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [transitioning, setTransitioning] = useState(true);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const images = heroImages ?? [];
  const imagesMobile = heroImagesMobile ?? [];
  const count = images.length;

  // Resetear índice cuando cambia el array de imágenes
  useEffect(() => {
    setCurrentIdx(0);
  }, [count]);

  // Auto-advance
  useEffect(() => {
    if (count <= 1 || paused) return;
    timerRef.current = setInterval(() => {
      setTransitioning(true);
      setCurrentIdx((prev) => (prev + 1) % count);
    }, slideInterval * 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [count, slideInterval, paused]);

  const goTo = (idx: number) => {
    setTransitioning(true);
    setCurrentIdx(idx);
    // Reiniciar timer al navegar manualmente
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleShop = useCallback(() => {
    setHasBrowsed(true);
    setActiveCategory('');
    const productsEl = document.getElementById('products-section');
    if (productsEl) productsEl.scrollIntoView({ behavior: 'smooth' });
  }, [setHasBrowsed, setActiveCategory]);

  return (
    <div
      className="relative w-full h-screen bg-alonzo-gray-100 overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Carrusel track */}
      {images.length > 0 && (
        <div
          className="absolute inset-0 flex h-full"
          style={{
            width: `${count * 100}%`,
            transform: `translateX(-${(currentIdx / count) * 100}%)`,
            transition: transitioning ? 'transform 0.7s cubic-bezier(0.25, 0.1, 0.25, 1)' : 'none',
          }}
        >
          {images.map((img, idx) => {
            const mobileImg = imagesMobile[idx] || img;
            return (
              <div
                key={img + idx}
                className="relative h-full flex-shrink-0"
                style={{ width: `${100 / count}%` }}
              >
                {/* Imagen móvil */}
                <img
                  src={mobileImg}
                  alt="Hero Banner"
                  className="md:hidden absolute inset-0 w-full h-full object-cover object-top"
                />
                {/* Imagen desktop */}
                <img
                  src={img}
                  alt="Hero Banner"
                  className="hidden md:block absolute inset-0 w-full h-full object-cover object-top"
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Gradient */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-black/15 to-transparent pointer-events-none z-10" />

      {/* Texto */}
      <div className="absolute z-20 bottom-12 left-4 right-4 md:bottom-16 md:left-12 md:right-auto md:max-w-[400px]">
        <p className="text-[10px] md:text-xs font-sans tracking-[0.3em] uppercase text-white font-medium mb-3 md:mb-4 drop-shadow-lg stagger-up stagger-1">
          New Arrivals
        </p>
        <h2 className="font-editorial font-normal text-white text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] uppercase tracking-[0.04em] leading-[1.05] mb-5 md:mb-7 drop-shadow-xl stagger-up stagger-2">
          {heroSubtitle}
        </h2>
        <button
          onClick={handleShop}
          className="inline-block px-10 md:px-14 py-3.5 md:py-4 bg-white text-alonzo-black text-[11px] md:text-xs font-sans font-semibold tracking-[0.2em] uppercase hover:bg-alonzo-black hover:text-white transition-colors duration-300 shadow-xl stagger-up stagger-3"
        >
          Shop Now
        </button>
      </div>

      {/* Dot indicators */}
      {count > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goTo(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIdx ? 'bg-white w-5' : 'bg-white/50 w-1.5'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

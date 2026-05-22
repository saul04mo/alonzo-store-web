'use client';
import { useCallback, useState } from 'react';
import Image from 'next/image';
import { useUIStore } from '@/stores';
import { useWebSettings } from '@/lib/useWebSettings';

interface HeroBannerProps {
  initialHeroImage?: string;
  initialHeroSubtitle?: string;
  initialHeroImageMobile?: string;
}

export function HeroBanner({ initialHeroImage, initialHeroSubtitle, initialHeroImageMobile }: HeroBannerProps = {}) {
  const setHasBrowsed = useUIStore((s) => s.setHasBrowsed);
  const setActiveCategory = useUIStore((s) => s.setActiveCategory);
  const settings = useWebSettings();

  const heroImage = settings.loaded ? settings.heroImage : (initialHeroImage || settings.heroImage);
  const heroSubtitle = settings.loaded ? settings.heroSubtitle : (initialHeroSubtitle || settings.heroSubtitle);
  const heroImageMobile = settings.loaded
    ? (settings.heroImageMobile || settings.heroImage)
    : (initialHeroImageMobile || initialHeroImage || settings.heroImage);

  const [desktopLoaded, setDesktopLoaded] = useState(false);
  const [mobileLoaded, setMobileLoaded] = useState(false);

  const handleShop = useCallback(() => {
    setHasBrowsed(true);
    setActiveCategory('');
    const productsEl = document.getElementById('products-section');
    if (productsEl) productsEl.scrollIntoView({ behavior: 'smooth' });
  }, [setHasBrowsed, setActiveCategory]);

  const imgClass = (loaded: boolean) =>
    `absolute inset-0 w-full h-full object-cover object-top transition-all duration-1000 ease-out ${
      loaded ? 'opacity-100 blur-0 scale-100' : 'opacity-0 blur-md scale-[1.02]'
    }`;

  return (
    <div className="relative w-full h-screen bg-alonzo-gray-100 overflow-hidden">

      {/* Imagen móvil — visible solo en < md */}
      <img
        src={heroImageMobile}
        alt="Hero Banner"
        onLoad={() => setMobileLoaded(true)}
        className={`md:hidden ${imgClass(mobileLoaded)}`}
      />

      {/* Imagen desktop — visible solo en ≥ md */}
      <img
        src={heroImage}
        alt="Hero Banner"
        onLoad={() => setDesktopLoaded(true)}
        className={`hidden md:block ${imgClass(desktopLoaded)}`}
      />

      <div className="absolute inset-0 bg-gradient-to-tr from-black/50 via-black/15 to-transparent pointer-events-none" />

      <div className="absolute z-10 bottom-12 left-4 right-4 md:bottom-16 md:left-12 md:right-auto md:max-w-[400px]">
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
    </div>
  );
}

'use client';
import type { Gender } from '@/types';

interface HeroSectionProps {
  onGenderChange: (g: Gender) => void;
}

const categories = [
  {
    gender: 'Mujer' as Gender,
    label: 'MODA PARA MUJER',
    image: 'https://images.unsplash.com/photo-1487222477894-8943e31ef7b2?w=600&h=400&fit=crop&q=80',
  },
  {
    gender: 'Hombre' as Gender,
    label: 'MODA PARA HOMBRE',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop&q=80',
  },
];

export function HeroSection({ onGenderChange }: HeroSectionProps) {
  return (
    <section className="w-full max-w-[1400px] mx-auto px-4 md:px-10 py-10 md:py-16">
      {/* Title */}
      <h2 className="text-center text-lg md:text-xl font-normal text-alonzo-charcoal mb-8 md:mb-12 tracking-wide">
        Elige una opción
      </h2>

      {/* Category cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {categories.map((cat) => (
          <button
            key={cat.gender}
            onClick={() => onGenderChange(cat.gender)}
            className="group relative overflow-hidden aspect-[4/3] md:aspect-[16/9] rounded-sm"
          >
            {/* Background image */}
            <img
              src={cat.image}
              alt={cat.label}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition-colors duration-300" />

            {/* Text label */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-white text-lg md:text-xl font-medium tracking-[0.15em] uppercase">
                {cat.label}
              </span>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

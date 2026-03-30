'use client';
interface CategoryChipsProps {
  categories: string[];
  active: string;
  onChange: (cat: string) => void;
}

export function CategoryChips({ categories, active, onChange }: CategoryChipsProps) {
  if (categories.length === 0) return null;

  return (
    <div className="max-w-[1400px] mx-auto px-4 md:px-10">
      <div className="flex overflow-x-auto gap-2 md:gap-3 pb-5 scrollbar-hide md:justify-center md:flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={`
              px-5 py-2 text-2xs md:text-xs font-medium rounded-full whitespace-nowrap
              tracking-wide border transition-all duration-200
              ${
                cat === active
                  ? 'bg-alonzo-black text-white border-alonzo-black'
                  : 'bg-white text-alonzo-gray-600 border-alonzo-gray-300 hover:border-alonzo-charcoal hover:text-alonzo-black'
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export interface Announcement {
  text: string;
  link?: string;
  order: number;
}

interface Props {
  /** Anuncios pre-fetched desde el server (en RootLayout) — el primer paint ya viene con datos */
  initialAnnouncements?: Announcement[];
}

const SPEED_PX_PER_SEC = 80;

export function AnnouncementBar({ initialAnnouncements = [] }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [animation, setAnimation] = useState<string>('none');
  const trackRef = useRef<HTMLDivElement>(null);

  // 1. Al montar, calcula la animación INTRO (de translateX(0) a translateX(-100%))
  //    Esto deja el texto visible desde la izquierda y lo desliza hacia afuera.
  // 2. Al terminar la intro, switchea a la animación LOOP infinita
  //    (entra desde la derecha 100vw, sale por la izquierda -100%).
  // Resultado: nunca se ven dos copias del texto a la vez.
  useEffect(() => {
    const track = trackRef.current;
    if (!track || initialAnnouncements.length === 0) return;

    const blockWidth = track.scrollWidth;
    const introDuration = Math.max(8, Math.round(blockWidth / SPEED_PX_PER_SEC));
    setAnimation(`annMarqueeIntro ${introDuration}s linear forwards`);

    const handleEnd = () => {
      const viewportWidth = window.innerWidth;
      // El track debe recorrer (viewport + bloque entero) para entrar y salir
      const loopDuration = Math.max(15, Math.round((viewportWidth + blockWidth) / SPEED_PX_PER_SEC));
      setAnimation(`annMarqueeLoop ${loopDuration}s linear infinite`);
    };

    track.addEventListener('animationend', handleEnd, { once: true });
    return () => track.removeEventListener('animationend', handleEnd);
  }, [initialAnnouncements]);

  if (dismissed) return null;

  // Contenedor con altura fija siempre — cero layout shift incluso sin contenido
  return (
    <div className="w-full bg-alonzo-black text-white relative overflow-hidden h-[22px]">
      {initialAnnouncements.length > 0 && (
        <div
          ref={trackRef}
          className="absolute top-0 left-0 h-full flex items-center whitespace-nowrap will-change-transform"
          style={{ animation }}
        >
          <span className="text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-medium leading-none flex items-center px-4">
            {initialAnnouncements.map((a, i) => (
              <span key={i} className="inline-flex items-center">
                {i > 0 && <span className="mx-6 opacity-60">—</span>}
                {a.link ? (
                  <a href={a.link} target="_blank" rel="noopener noreferrer" className="hover:underline">{a.text}</a>
                ) : (
                  <span>{a.text}</span>
                )}
              </span>
            ))}
          </span>
        </div>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors z-10 bg-alonzo-black px-1"
        aria-label="Cerrar anuncio"
      >
        <X size={12} strokeWidth={2} />
      </button>
    </div>
  );
}

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
  const [duration, setDuration] = useState(30);
  const [repeats, setRepeats] = useState(1);
  const trackRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);

  // Algoritmo:
  // 1. Mido el ancho de UNA copia del contenido
  // 2. Si la copia es más angosta que el viewport, la replico N veces hasta
  //    que la "unidad" sea > viewport (así el loop nunca deja gap visible)
  // 3. Después duplico esa unidad → 2 copias seguidas → translate 0 → -50%
  //    da loop perfectamente seamless sin huecos.
  useEffect(() => {
    if (!measureRef.current || initialAnnouncements.length === 0) return;
    const oneBlockWidth = measureRef.current.scrollWidth;
    if (oneBlockWidth === 0) return;

    const viewportWidth = window.innerWidth;
    // Cuántas veces tengo que repetir el bloque para que la "unidad" llene el viewport
    const minRepeats = Math.max(1, Math.ceil(viewportWidth / oneBlockWidth));
    setRepeats(minRepeats);

    // Velocidad: queremos ~80 px/s sobre el ancho de UNA unidad (no del track entero)
    const unitWidth = oneBlockWidth * minRepeats;
    const seconds = Math.max(15, Math.round(unitWidth / SPEED_PX_PER_SEC));
    setDuration(seconds);
  }, [initialAnnouncements]);

  if (dismissed) return null;

  // Render del contenido (separadores SOLO entre items + uno al final para conectar con la siguiente unidad)
  const renderItems = () => initialAnnouncements.map((a, i) => (
    <span key={i} className="inline-flex items-center">
      {i > 0 && <span className="mx-6 opacity-60">—</span>}
      {a.link ? (
        <a href={a.link} target="_blank" rel="noopener noreferrer" className="hover:underline">{a.text}</a>
      ) : (
        <span>{a.text}</span>
      )}
    </span>
  ));

  // Una "unidad" puede ser el contenido replicado N veces para llenar el viewport
  const renderUnit = (ariaHidden: boolean) => (
    <span
      className="text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-medium leading-none flex items-center"
      aria-hidden={ariaHidden || undefined}
    >
      {Array.from({ length: repeats }).map((_, r) => (
        <span key={r} className="inline-flex items-center">
          {r > 0 && <span className="mx-6 opacity-60">—</span>}
          {renderItems()}
        </span>
      ))}
      {/* Separador final que conecta con la siguiente unidad (idéntico en ambas copias) */}
      <span className="mx-6 opacity-60">—</span>
    </span>
  );

  const hasContent = initialAnnouncements.length > 0;

  return (
    <div className="w-full bg-alonzo-black text-white relative overflow-hidden h-[22px]">
      {/* Span invisible solo para medir el ancho real de UN bloque */}
      <span
        ref={measureRef}
        className="absolute opacity-0 pointer-events-none -z-10 text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-medium leading-none whitespace-nowrap"
        aria-hidden="true"
      >
        {renderItems()}
      </span>

      {hasContent && (
        <div
          ref={trackRef}
          className="absolute top-0 left-0 h-full flex items-center whitespace-nowrap will-change-transform"
          style={{ animation: `annMarqueeLoop ${duration}s linear infinite` }}
        >
          {renderUnit(false)}
          {renderUnit(true)}
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

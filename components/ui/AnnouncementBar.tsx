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

export function AnnouncementBar({ initialAnnouncements = [] }: Props) {
  const [dismissed, setDismissed] = useState(false);
  const [duration, setDuration] = useState(30);
  const trackRef = useRef<HTMLDivElement>(null);

  // Calcula duración basada en el ancho real de UNA copia (~80 px/s)
  useEffect(() => {
    if (!trackRef.current || initialAnnouncements.length === 0) return;
    const oneCopyWidth = trackRef.current.scrollWidth / 2;
    const seconds = Math.max(15, Math.round(oneCopyWidth / 80));
    setDuration(seconds);
  }, [initialAnnouncements]);

  if (dismissed) return null;

  // Bloque que se renderiza dos veces para loop seamless.
  // Separadores SOLO entre items (no antes ni después) para que las dos copias sean idénticas.
  const renderBlock = (ariaHidden: boolean) => (
    <span
      className="text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-medium leading-none flex items-center"
      aria-hidden={ariaHidden || undefined}
    >
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
      <span className="mx-6 opacity-60">—</span>
    </span>
  );

  const hasContent = initialAnnouncements.length > 0;

  // El contenedor SIEMPRE se renderiza con altura fija — cero layout shift,
  // incluso si no hay announcements o están vacíos.
  return (
    <div className="w-full bg-alonzo-black text-white relative overflow-hidden h-[22px]">
      {hasContent && (
        <div
          ref={trackRef}
          className="absolute top-0 left-0 h-full flex items-center whitespace-nowrap will-change-transform"
          style={{ animation: `annMarquee ${duration}s linear infinite` }}
        >
          {renderBlock(false)}
          {renderBlock(true)}
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

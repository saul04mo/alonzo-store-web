'use client';
import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { db, collection, getDocs } from '@/lib/firebase-client';

interface Announcement {
  text: string;
  link?: string;
  order: number;
}

let cachedAnnouncements: Announcement[] | null = null;

export function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(cachedAnnouncements || []);
  const [dismissed, setDismissed] = useState(false);
  const [duration, setDuration] = useState(30);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cachedAnnouncements) return;
    (async () => {
      try {
        const snap = await getDocs(collection(db, 'announcements'));
        const items: Announcement[] = [];
        snap.forEach((doc) => {
          const d = doc.data();
          if (d.active !== false) {
            items.push({ text: d.text || '', link: d.link || '', order: d.order || 0 });
          }
        });
        items.sort((a, b) => a.order - b.order);
        cachedAnnouncements = items;
        setAnnouncements(items);
      } catch (err) {
        console.error('AnnouncementBar:', err);
      }
    })();
  }, []);

  // Calcula duración basada en el ancho real del contenido (~80 px/s)
  useEffect(() => {
    if (!trackRef.current || announcements.length === 0) return;
    // El track tiene 2 copias del contenido; queremos la velocidad sobre 1 copia
    const oneCopyWidth = trackRef.current.scrollWidth / 2;
    const seconds = Math.max(15, Math.round(oneCopyWidth / 80));
    setDuration(seconds);
  }, [announcements]);

  if (dismissed || announcements.length === 0) return null;

  // Concatena todos los announcements en una sola cadena con separador
  const items = announcements.map((a, i) => (
    <span key={i} className="inline-flex items-center">
      {a.link ? (
        <a href={a.link} target="_blank" rel="noopener noreferrer" className="hover:underline">{a.text}</a>
      ) : (
        <span>{a.text}</span>
      )}
      <span className="mx-6 opacity-60" aria-hidden="true">—</span>
    </span>
  ));

  return (
    <div className="w-full bg-alonzo-black text-white relative overflow-hidden h-[22px]">
      <div
        ref={trackRef}
        className="absolute top-0 left-0 h-full flex items-center whitespace-nowrap will-change-transform"
        style={{ animation: `annMarquee ${duration}s linear infinite` }}
      >
        <span className="text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-medium leading-none flex items-center pl-4">
          {items}
        </span>
        {/* Copia duplicada para loop seamless */}
        <span className="text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-medium leading-none flex items-center" aria-hidden="true">
          {items}
        </span>
      </div>
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

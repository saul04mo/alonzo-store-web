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
  const [currentIdx, setCurrentIdx] = useState(0);
  const [tick, setTick] = useState(0);
  const spanRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [animStyle, setAnimStyle] = useState<React.CSSProperties>({});

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

  // Start animation whenever index or tick changes
  useEffect(() => {
    if (announcements.length === 0) return;
    const span = spanRef.current;
    const container = containerRef.current;
    if (!span || !container) return;

    // Measure
    const containerW = container.offsetWidth;
    const textW = span.offsetWidth;
    const distance = containerW + textW;
    const speed = 60; // px per second
    const duration = distance / speed;

    // Reset to start position
    setAnimStyle({
      transform: `translateX(${containerW}px)`,
      transition: 'none',
    });

    // Start sliding after a frame
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimStyle({
          transform: `translateX(-${textW}px)`,
          transition: `transform ${duration}s linear`,
        });
      });
    });

    // When done, go to next
    const timer = setTimeout(() => {
      setCurrentIdx((prev) => (prev + 1) % Math.max(announcements.length, 1));
      setTick((t) => t + 1);
    }, duration * 1000 + 100);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [currentIdx, tick, announcements.length]);

  if (dismissed) return null;

  const current = announcements[currentIdx];

  return (
    <div ref={containerRef} className="w-full bg-alonzo-black text-white relative overflow-hidden h-[22px]">
      {current && (
        <span
          ref={spanRef}
          key={`${currentIdx}-${tick}`}
          style={animStyle}
          className="absolute h-full flex items-center text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-medium leading-none whitespace-nowrap will-change-transform"
        >
          {current.link ? (
            <a href={current.link} target="_blank" rel="noopener noreferrer" className="hover:underline">{current.text}</a>
          ) : (
            current.text
          )}
        </span>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors z-10"
      >
        <X size={12} strokeWidth={2} />
      </button>
    </div>
  );
}

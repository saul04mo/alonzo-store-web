'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
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
  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<Animation | null>(null);

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

  const startAnimation = useCallback(() => {
    const text = textRef.current;
    const container = containerRef.current;
    if (!text || !container || announcements.length === 0) return;

    const textW = text.offsetWidth;
    const containerW = container.offsetWidth;
    const distance = containerW + textW;
    const speed = 60; // pixels per second
    const duration = (distance / speed) * 1000;

    if (animRef.current) animRef.current.cancel();

    const anim = text.animate([
      { transform: `translateX(${containerW}px)` },
      { transform: `translateX(-${textW}px)` },
    ], {
      duration,
      easing: 'linear',
    });

    anim.onfinish = () => {
      if (announcements.length > 1) {
        setCurrentIdx((prev) => (prev + 1) % announcements.length);
      } else {
        startAnimation();
      }
    };

    animRef.current = anim;
  }, [announcements]);

  useEffect(() => {
    startAnimation();
    return () => { if (animRef.current) animRef.current.cancel(); };
  }, [currentIdx, startAnimation]);

  if (dismissed || announcements.length === 0) return null;

  const current = announcements[currentIdx];

  return (
    <div ref={containerRef} className="w-full bg-alonzo-black text-white relative overflow-hidden h-[22px]">
      <div className="h-full flex items-center">
        <span
          ref={textRef}
          className="text-[8px] sm:text-[9px] tracking-[0.15em] uppercase font-medium leading-none whitespace-nowrap absolute"
        >
          {current.link ? (
            <a href={current.link} target="_blank" rel="noopener noreferrer" className="hover:underline">{current.text}</a>
          ) : (
            current.text
          )}
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors z-10"
      >
        <X size={12} strokeWidth={2} />
      </button>
    </div>
  );
}

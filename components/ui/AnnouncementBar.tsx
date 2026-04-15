'use client';
import { useState, useEffect } from 'react';
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
  const [ready, setReady] = useState(!!cachedAnnouncements);

  useEffect(() => {
    if (cachedAnnouncements) { setReady(true); return; }
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
        setReady(true);
      } catch (err) {
        console.error('AnnouncementBar:', err);
        setReady(true);
      }
    })();
  }, []);

  // Speed: ~60px per second regardless of screen size
  const [duration, setDuration] = useState(15);
  useEffect(() => {
    const w = window.innerWidth;
    setDuration(Math.round((w + 300) / 60));
  }, []);

  // Cycle to next announcement after animation
  useEffect(() => {
    if (!ready || announcements.length <= 1) return;
    const timer = setTimeout(() => {
      setCurrentIdx((prev) => (prev + 1) % announcements.length);
      setTick((t) => t + 1);
    }, duration * 1000);
    return () => clearTimeout(timer);
  }, [currentIdx, tick, ready, announcements.length, duration]);

  if (dismissed) return null;

  const current = announcements[currentIdx];

  return (
    <div className="w-full bg-alonzo-black text-white relative overflow-hidden h-[22px]">
      {current && (
        <div
          key={`${currentIdx}-${tick}`}
          className="absolute h-full flex items-center whitespace-nowrap"
          style={{
            animation: `annMarquee ${duration}s linear forwards`,
          }}
        >
          <span className="text-[9px] sm:text-[10px] tracking-[0.15em] uppercase font-medium leading-none px-4">
            {current.link ? (
              <a href={current.link} target="_blank" rel="noopener noreferrer" className="hover:underline">{current.text}</a>
            ) : (
              current.text
            )}
          </span>
        </div>
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

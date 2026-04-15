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

  const handleAnimEnd = () => {
    setCurrentIdx((prev) => (prev + 1) % Math.max(announcements.length, 1));
    setTick((t) => t + 1);
  };

  if (dismissed) return null;

  const current = announcements[currentIdx];

  return (
    <div className="w-full bg-alonzo-black text-white relative overflow-hidden h-[22px]">
      {current && (
        <span
          key={`${currentIdx}-${tick}`}
          onAnimationEnd={handleAnimEnd}
          className="ann-marquee absolute h-full flex items-center text-[8px] sm:text-[9px] tracking-[0.15em] uppercase font-medium leading-none whitespace-nowrap will-change-transform"
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
      <style jsx>{`
        @keyframes annMarquee {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(calc(-100%)); }
        }
        .ann-marquee {
          animation: annMarquee 18s linear forwards;
          left: 0;
        }
      `}</style>
    </div>
  );
}

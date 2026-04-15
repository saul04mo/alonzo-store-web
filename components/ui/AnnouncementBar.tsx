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
  const [sliding, setSliding] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

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

  useEffect(() => {
    if (announcements.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setSliding(true);
      setTimeout(() => {
        setSliding(false);
        setCurrentIdx((prev) => (prev + 1) % announcements.length);
      }, 800);
    }, 4000);
    return () => clearInterval(intervalRef.current);
  }, [announcements.length]);

  if (dismissed || announcements.length === 0) return null;

  const current = announcements[currentIdx];
  const nextIdx = (currentIdx + 1) % announcements.length;
  const next = announcements[nextIdx];

  const renderText = (ann: Announcement) =>
    ann.link ? (
      <a href={ann.link} target="_blank" rel="noopener noreferrer" className="hover:underline">{ann.text}</a>
    ) : ann.text;

  return (
    <div className="w-full bg-alonzo-black text-white relative overflow-hidden h-[22px]">
      {/* Sliding container: two items side by side, shifts left by 100% */}
      <div
        className="flex h-full transition-transform duration-[800ms] ease-in-out"
        style={{ width: '200%', transform: sliding ? 'translateX(-50%)' : 'translateX(0)' }}
      >
        <div className="w-1/2 flex items-center justify-center px-8 text-[8px] sm:text-[9px] tracking-[0.15em] uppercase font-medium leading-none whitespace-nowrap">
          {renderText(current)}
        </div>
        <div className="w-1/2 flex items-center justify-center px-8 text-[8px] sm:text-[9px] tracking-[0.15em] uppercase font-medium leading-none whitespace-nowrap">
          {renderText(next)}
        </div>
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

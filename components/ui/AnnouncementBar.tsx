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
  const [currentIdx, setCurrentIdx] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [animating, setAnimating] = useState(false);
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
      setAnimating(true);
      setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % announcements.length);
        setAnimating(false);
      }, 300);
    }, 4000);
    return () => clearInterval(intervalRef.current);
  }, [announcements.length]);

  if (dismissed) return null;

  const current = announcements[currentIdx];

  return (
    <div className="w-full bg-alonzo-black text-white relative overflow-hidden h-[22px] flex items-center justify-center px-8">
      {current && (
        <p
          key={currentIdx}
          className={`text-[8px] sm:text-[9px] tracking-[0.15em] uppercase font-medium leading-none absolute inset-0 flex items-center justify-center px-8 transition-all duration-300 ${
            animating ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'
          }`}
        >
          {current.link ? (
            <a href={current.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {current.text}
            </a>
          ) : (
            current.text
          )}
        </p>
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

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

  if (dismissed || announcements.length === 0) return null;

  // Each announcement gets plenty of space, then repeats
  const spacer = '\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0';

  return (
    <div className="w-full bg-alonzo-black text-white relative overflow-hidden h-[22px]">
      <div className="ann-track h-full flex items-center">
        {[0, 1].map((copy) => (
          <span key={copy} className="ann-segment text-[8px] sm:text-[9px] tracking-[0.15em] uppercase font-medium leading-none whitespace-nowrap">
            {announcements.map((a, i) => (
              <span key={`${copy}-${i}`}>
                {a.link ? (
                  <a href={a.link} target="_blank" rel="noopener noreferrer" className="hover:underline">{a.text}</a>
                ) : (
                  a.text
                )}
                {spacer}
              </span>
            ))}
          </span>
        ))}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors z-10"
      >
        <X size={12} strokeWidth={2} />
      </button>
      <style jsx>{`
        .ann-track {
          display: flex;
          width: max-content;
          animation: annScroll var(--ann-duration, 20s) linear infinite;
        }
        @keyframes annScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}

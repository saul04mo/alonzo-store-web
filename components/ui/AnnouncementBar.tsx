'use client';
import { useState, useEffect, useRef } from 'react';
import { onSnapshot, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';

interface Announcement {
  text: string;
  link?: string;
  active: boolean;
  order: number;
}

export function AnnouncementBar() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  // Listen to Firestore collection in real time
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'announcements'),
      (snap) => {
        const items: Announcement[] = [];
        snap.forEach((doc) => {
          const data = doc.data();
          if (data.active !== false) {
            items.push({
              text: data.text || '',
              link: data.link || '',
              active: data.active !== false,
              order: data.order || 0,
            });
          }
        });
        items.sort((a, b) => a.order - b.order);
        setAnnouncements(items);
        setCurrentIdx(0);
      },
      () => { /* fail silently */ }
    );
    return () => unsub();
  }, []);

  // Alternate between announcements every 4 seconds
  useEffect(() => {
    if (announcements.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setCurrentIdx((prev) => (prev + 1) % announcements.length);
        setVisible(true);
      }, 300);
    }, 4000);
    return () => clearInterval(intervalRef.current);
  }, [announcements.length]);

  if (announcements.length === 0) return null;

  const current = announcements[currentIdx];
  if (!current) return null;

  return (
    <div className="w-full bg-alonzo-black text-white text-center py-2.5 overflow-hidden">
      <p
        className={`text-[10px] sm:text-[11px] tracking-[0.15em] uppercase font-medium transition-all duration-300 ${
          visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
        }`}
      >
        {current.link ? (
          <a
            href={current.link}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            {current.text}
          </a>
        ) : (
          current.text
        )}
      </p>
    </div>
  );
}

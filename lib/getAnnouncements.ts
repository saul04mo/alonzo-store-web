/**
 * Server-side fetch de announcements.
 * Se cachea 5min con revalidate para no martillar Firestore en cada request.
 * El resultado viene en el HTML inicial — sin parpadeo ni layout shift.
 */
import { adminDb } from './firebase-admin';

export interface Announcement {
  text: string;
  link?: string;
  order: number;
}

export const revalidate = 300; // 5 min

export async function getAnnouncements(): Promise<Announcement[]> {
  try {
    const snap = await adminDb.collection('announcements').get();
    const items: Announcement[] = [];
    snap.forEach((doc) => {
      const d = doc.data();
      if (d.active !== false) {
        items.push({
          text: d.text || '',
          link: d.link || '',
          order: d.order || 0,
        });
      }
    });
    items.sort((a, b) => a.order - b.order);
    return items;
  } catch (err) {
    console.error('[getAnnouncements] failed:', err);
    return [];
  }
}

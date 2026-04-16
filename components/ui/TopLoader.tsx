'use client';
import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';

export function TopLoader() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval>>();
  const prevPath = useRef(pathname);

  useEffect(() => {
    // Pathname changed = navigation complete
    if (prevPath.current !== pathname) {
      // Finish the bar
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setLoading(false);
        setProgress(0);
      }, 300);
      prevPath.current = pathname;
    }
  }, [pathname]);

  // Listen for click on internal links to START the bar
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto')) return;
      if (anchor.target === '_blank') return;

      // Same page — skip
      if (href === pathname) return;

      // Start loading
      setLoading(true);
      setVisible(true);
      setProgress(15);

      // Simulate progress
      let p = 15;
      clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        p += Math.random() * 12;
        if (p > 90) p = 90;
        setProgress(p);
      }, 200);
    };

    document.addEventListener('click', handleClick);
    return () => {
      document.removeEventListener('click', handleClick);
      clearInterval(timerRef.current);
    };
  }, [pathname]);

  // Cleanup interval when loading stops
  useEffect(() => {
    if (!loading) {
      clearInterval(timerRef.current);
    }
  }, [loading]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-[2.5px]">
      <div
        className="h-full bg-alonzo-black"
        style={{
          width: `${progress}%`,
          transition: progress === 100
            ? 'width 0.2s ease-out, opacity 0.3s ease 0.1s'
            : 'width 0.4s ease-out',
          opacity: progress === 100 ? 0 : 1,
        }}
      />
    </div>
  );
}

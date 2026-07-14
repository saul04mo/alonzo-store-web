'use client';

import { useEffect, useRef } from 'react';
import { trackEvent } from '@/lib/analytics';

const MILESTONES = [25, 50, 75, 100] as const;

/**
 * Registra hasta dónde scrollea el visitante, en hitos de 25/50/75/100%.
 *
 * Es el dato que distingue "entró y rebotó en el hero" de "recorrió toda la
 * grilla y aun así no abrió un producto" — dos problemas opuestos que en el
 * reporte de páginas se ven exactamente igual.
 *
 * Cada hito se manda una sola vez por contexto. `context` identifica QUÉ se
 * estaba mirando (home / una categoría), y al cambiar se reinician los hitos:
 * sin eso, el primer scroll de la sesión silenciaría todos los siguientes.
 */
export function useScrollDepth(context: string): void {
  const firedRef = useRef<Set<number>>(new Set());

  // Reinicia los hitos al cambiar de contexto (ej. home → categoría).
  useEffect(() => {
    firedRef.current = new Set();
  }, [context]);

  useEffect(() => {
    // Un scroll listener corre en cada frame de scroll; rAF lo acota a uno
    // por repintado y evita trabar el scroll en móvil (97% de tu tráfico).
    let ticking = false;

    const measure = () => {
      ticking = false;

      const scrolled = window.scrollY + window.innerHeight;
      const total = document.documentElement.scrollHeight;
      if (total <= window.innerHeight) return; // Página sin scroll posible.

      const pct = (scrolled / total) * 100;

      for (const milestone of MILESTONES) {
        if (pct >= milestone && !firedRef.current.has(milestone)) {
          firedRef.current.add(milestone);
          void trackEvent('scroll_depth', { percent: milestone, context });
        }
      }
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(measure);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [context]);
}

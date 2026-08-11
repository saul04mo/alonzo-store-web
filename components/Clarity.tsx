'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { clarityView } from '@/lib/clarity';

// Microsoft Clarity — mapas de calor + grabaciones de sesión (gratis).
// El ID del proyecto se crea en https://clarity.microsoft.com y se configura
// en la variable NEXT_PUBLIC_CLARITY_ID. Si no hay ID, no carga nada (no
// rompe la app). Corre solo en el navegador del visitante, igual que GA.

function titleCase(s: string): string {
  return s
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// Nombre legible de la vista según la ruta. Sin esto Clarity solo ve la URL, y
// como el catálogo entero vive en "/" con query params, casi toda la sesión se
// reporta como una sola página. Mismo criterio que components/Analytics.tsx.
function viewName(pathname: string, params: URLSearchParams): string {
  if (pathname === '/') {
    const category = params.get('category');
    const gender = params.get('gender');
    if (category) return `Categoría: ${titleCase(category)}${gender ? ` (${gender})` : ''}`;
    if (gender) return `Inicio — ${gender}`;
    return 'Inicio';
  }
  if (pathname.startsWith('/product/')) {
    // document.title trae el nombre del producto (lo pone la metadata de la
    // ruta); el fallback cubre el instante previo a que Next lo actualice.
    const t = document.title.replace(/\s*\|\s*ALONZO Store\s*$/i, '').trim();
    return t && t !== 'ALONZO Store' ? `Producto: ${t}` : 'Producto';
  }
  if (pathname === '/search') {
    const q = params.get('q');
    return q ? `Búsqueda: ${q}` : 'Búsqueda';
  }
  const fixed: Record<string, string> = {
    '/cart': 'Carrito',
    '/checkout': 'Checkout',
    '/account': 'Mi cuenta',
    '/account/orders': 'Mis pedidos',
    '/account/wishlist': 'Lista de deseos',
    '/account/details': 'Mis datos',
    '/account/coupons': 'Mis cupones',
    '/privacy': 'Privacidad',
    '/terms': 'Términos',
  };
  return fixed[pathname] || pathname;
}

// Id estable por tipo de vista, para que Clarity agrupe (todos los productos
// caen en "producto", todas las búsquedas en "busqueda", etc.).
function viewId(pathname: string, params: URLSearchParams): string {
  if (pathname === '/') {
    const category = params.get('category');
    const gender = params.get('gender');
    if (category) return `categoria-${category}${gender ? `-${gender}` : ''}`;
    if (gender) return `inicio-${gender}`;
    return 'inicio';
  }
  if (pathname.startsWith('/product/')) return 'producto';
  if (pathname === '/search') return 'busqueda';
  return pathname;
}

export function Clarity() {
  const id = process.env.NEXT_PUBLIC_CLARITY_ID;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastRef = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;
    // El sync de URL del catálogo re-dispara este efecto con la misma URL (ver
    // lib/useCatalogUrlState.ts); sin el guard renombraríamos la vista en bucle.
    const key = `${pathname}?${searchParams.toString()}`;
    if (lastRef.current === key) return;
    lastRef.current = key;

    // En navegación cliente Next actualiza el <title> DESPUÉS de cambiar la
    // ruta, y la ficha de producto lo necesita para su nombre.
    const timer = setTimeout(() => {
      clarityView(viewName(pathname, searchParams), viewId(pathname, searchParams));
    }, 300);
    return () => clearTimeout(timer);
  }, [id, pathname, searchParams]);

  if (!id) return null;

  return (
    // afterInteractive, no lazyOnload: como grabador de sesión tiene que estar
    // activo desde el arranque. Con lazyOnload se perdían los primeros
    // segundos y las navegaciones tempranas de la sesión.
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${id}");`}
    </Script>
  );
}

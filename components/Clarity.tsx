'use client';

import Script from 'next/script';

// Microsoft Clarity — mapas de calor + grabaciones de sesión (gratis).
// El ID del proyecto se crea en https://clarity.microsoft.com y se configura
// en la variable NEXT_PUBLIC_CLARITY_ID. Si no hay ID, no carga nada (no
// rompe la app). Corre solo en el navegador del visitante, igual que GA.
export function Clarity() {
  const id = process.env.NEXT_PUBLIC_CLARITY_ID;
  if (!id) return null;

  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${id}");`}
    </Script>
  );
}

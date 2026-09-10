'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Página propia (y no un ancla dentro de /privacy) porque PrivacyPage hace
// window.scrollTo(0, 0) al montar: un /privacy#eliminacion dejaría al revisor
// de Meta al principio de la política, sin ver la sección que vino a leer.
// Esta es la URL que va en el campo "Data Deletion Instructions" de la app.
export function DataDeletionPage() {
  const router = useRouter();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full max-w-[800px] mx-auto px-5 md:px-10 py-12 md:py-20 font-sans">
      <button
        onClick={() => {
          if (window.history.state?.idx > 0) {
            router.back();
          } else {
            router.push('/');
          }
        }}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors mb-10"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
        </svg>
        Volver
      </button>

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Eliminación de datos</h1>
      <p className="text-sm text-gray-500 mb-10">Última actualización: Septiembre 2026</p>

      <div className="space-y-8 text-base text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Qué guardamos</h2>
          <p>
            Cuando compras o escribes a Alonzo Store guardamos únicamente lo necesario para atenderte:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Tu nombre.</li>
            <li>Tu cédula o RIF.</li>
            <li>Tu teléfono y tu dirección de entrega.</li>
            <li>Tu historial de pedidos.</li>
            <li>Las conversaciones de WhatsApp que hayas tenido con la tienda.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Cómo pedir el borrado</h2>
          <p>
            Escríbenos a{' '}
            <a href="mailto:maykalonzzo@gmail.com?subject=Eliminaci%C3%B3n%20de%20datos" className="underline hover:text-black">
              maykalonzzo@gmail.com
            </a>{' '}
            con el asunto <strong>&quot;Eliminación de datos&quot;</strong>, desde el mismo correo con el que te
            contactaste con la tienda. Si nos escribiste por WhatsApp, indícanos en el mensaje el número que
            usaste, para poder ubicar tus datos.
          </p>
          <p className="mt-2">
            No hace falta que expliques los motivos y la solicitud no tiene ningún costo.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Qué se borra y en cuánto tiempo</h2>
          <p>
            Borramos todo lo indicado en el punto 1 dentro de los <strong>30 días</strong> siguientes a tu
            solicitud, y te confirmamos por el mismo medio cuando esté hecho.
          </p>
          <p className="mt-2">
            La única excepción son los comprobantes de compras ya facturadas: la ley venezolana nos obliga a
            conservarlos por motivos fiscales. Esos comprobantes quedan archivados y no se usan para
            contactarte, ni para publicidad, ni se comparten con terceros.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Cuenta de usuario</h2>
          <p>
            Si tienes una cuenta en la tienda, se elimina junto con los datos: al procesar tu solicitud
            cerramos la cuenta y borramos tu lista de deseos, tus direcciones guardadas y tus cupones. No
            tienes que hacer nada más aparte de escribirnos.
          </p>
        </section>
      </div>
    </div>
  );
}

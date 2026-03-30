'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function TermsPage() {
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

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Términos y Condiciones</h1>
      <p className="text-sm text-gray-500 mb-10">Última actualización: Marzo 2026</p>

      <div className="space-y-8 text-base text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introducción</h2>
          <p>
            Bienvenido a Alonzo Store. Al acceder y utilizar nuestro sitio web, aceptas cumplir con los siguientes términos y condiciones. Te recomendamos leerlos detalladamente antes de realizar cualquier compra.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Uso del Sitio</h2>
          <p>
            El contenido de las páginas de este sitio web es para tu información y uso general. Está sujeto a cambios sin previo aviso. Ni nosotros ni terceros garantizamos la exactitud, puntualidad, rendimiento, integridad o idoneidad de la información y los materiales encontrados u ofrecidos en este sitio.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Compras y Pagos</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Todos los precios están sujetos a cambios sin previo aviso.</li>
            <li>Aceptamos pagos en USD e intercambios en Bolívares al tipo de cambio indicado en el momento de la compra.</li>
            <li>Para métodos de pago manuales (Zelle, Pago Móvil), el cliente debe proporcionar el comprobante correspondiente. Los pedidos no serán procesados hasta verificar los fondos.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Envíos y Entregas</h2>
          <p>
            Ofrecemos entregas personales, envíos por delivery automatizados por distancia y envíos a nivel nacional. Alonzo Store no se hace responsable por retrasos o inconvenientes ocasionados por agencias de encomienda externas.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Cambios y Devoluciones</h2>
          <p>
            Aceptamos devoluciones dentro de los 30 días posteriores a la compra, siempre que la prenda se encuentre en su estado original, sin uso y con sus etiquetas intactas. Los costos de envío por devolución corren por cuenta del cliente a menos que el producto presente defectos de fábrica.
          </p>
        </section>
      </div>
    </div>
  );
}

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function PrivacyPage() {
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

      <h1 className="text-3xl font-bold text-gray-900 mb-6">Política de Privacidad</h1>
      <p className="text-sm text-gray-500 mb-10">Última actualización: Marzo 2026</p>

      <div className="space-y-8 text-base text-gray-700 leading-relaxed">
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Recopilación de Información</h2>
          <p>
            En Alonzo Store valoramos tu privacidad. Solicitamos información personal (como nombre, cédula/RIF, teléfono y dirección) únicamente para procesar y entregar tus pedidos de manera eficiente.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Uso de la Información</h2>
          <p>
            La información que nos proporcionas se utiliza exclusivamente para:
          </p>
          <ul className="list-disc pl-5 space-y-2 mt-2">
            <li>Procesar transacciones y enviar comprobantes.</li>
            <li>Gestionar envíos y realizar entregas.</li>
            <li>Mejorar nuestro servicio de atención al cliente.</li>
            <li>Personalizar tu experiencia de compra en nuestra tienda.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Protección de Datos</h2>
          <p>
            Implementamos diversas medidas de seguridad para mantener la seguridad de tu información personal. Utilizamos encriptación de Firebase Auth para proteger información sensible transmitida en línea. Asimismo, protegemos tus datos sin conexión; solo los empleados que necesitan la información para realizar un trabajo específico tienen acceso a ella.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Cookies y Privacidad</h2>
          <p>
            Utilizamos "cookies" únicamente para recordar el estado de tu sesión (por ejemplo, los artículos en tu carrito) y mejorar el acceso y la experiencia de usuario.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Divulgación a Terceros</h2>
          <p>
            No vendemos, intercambiamos ni transferimos de ninguna otra forma a terceros tu información de identificación personal. Esto no incluye a terceros de confianza que nos asisten en la operación de nuestro sitio web o en la prestación de servicios, siempre que dichas partes acuerden mantener la confidencialidad de esta información.
          </p>
        </section>
      </div>
    </div>
  );
}

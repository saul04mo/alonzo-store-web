import Link from 'next/link';

export const metadata = {
  title: 'Página no encontrada',
};

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl md:text-8xl font-bold text-alonzo-gray-200 mb-4">404</p>
      <h1 className="text-lg md:text-xl font-semibold text-alonzo-charcoal mb-2">
        Página no encontrada
      </h1>
      <p className="text-sm text-alonzo-gray-500 mb-8 max-w-sm">
        Lo sentimos, la página que buscas no existe o fue movida.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-alonzo-black text-white text-[11px] tracking-[0.15em] uppercase font-semibold rounded-sm hover:bg-alonzo-charcoal transition-colors"
      >
        Volver a la tienda
      </Link>
    </div>
  );
}

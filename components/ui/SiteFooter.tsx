'use client';

import Link from 'next/link';
import { Instagram, Facebook, ChevronRight } from 'lucide-react';
import { useUIStore, useClientStore } from '@/stores';
import { useWebSettings } from '@/lib/useWebSettings';

const socialLinks = [
  { icon: 'instagram', href: 'https://www.instagram.com/alonzo.ve/' },
  { icon: 'facebook', href: 'https://www.facebook.com/alonzovenezuela' },
  { icon: 'tiktok', href: 'https://www.tiktok.com/@alonzo.ve' },
];

export function SiteFooter() {
  const setAuthOpen = useUIStore((s) => s.setAuthOpen);
  const client = useClientStore((s) => s.client);
  const { whatsappNumber } = useWebSettings();

  const footerSections = [
    {
      title: 'ATENCIÓN AL CLIENTE',
      links: [
        { label: '● LIVE CHAT', href: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hola, necesito ayuda.')}`, external: true },
        { label: 'CENTRO DE AYUDA', href: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Necesito soporte con mi pedido.')}`, external: true },
        { label: 'RASTREAR PEDIDO', href: '/account', external: false },
        { label: 'HACER DEVOLUCIÓN', href: `https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Quiero solicitar una devolución.')}`, external: true },
      ],
    },
  ];

  return (
    <footer className="border-t border-alonzo-gray-300 bg-white">
      {/* ── Mobile footer ── */}
      <div className="md:hidden px-6 pt-8 pb-20">
        {/* CTA */}
        <h3 className="text-xs font-bold tracking-widest text-alonzo-black mb-2">
          ÚNETE A ALONZO PRESTIGE
        </h3>
        <p className="text-[10px] text-alonzo-gray-600 tracking-wider leading-relaxed mb-4">
          GANA PUNTOS Y RECOMPENSAS EN TODAS TUS COMPRAS
        </p>
        {client ? (
          <Link href="/account" className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-widest text-alonzo-black mb-6">
            <ChevronRight size={12} /> MI CUENTA
          </Link>
        ) : (
          <button onClick={() => setAuthOpen(true)} className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-widest text-alonzo-black mb-6 uppercase">
            <ChevronRight size={12} /> REGÍSTRATE
          </button>
        )}

        {/* Sections stacked */}
        {footerSections.map((section) => (
          <div key={section.title} className="mb-5">
            <h4 className="text-[10px] font-bold tracking-widest text-alonzo-black mb-2.5">
              {section.title}
            </h4>
            <ul className="space-y-2">
              {section.links.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-[10px] text-alonzo-gray-600 tracking-wider">
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href} className="text-[10px] text-alonzo-gray-600 tracking-wider">
                      {link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Country + contact */}
        <div className="flex items-center gap-4 mb-4">
          <p className="text-[10px] text-alonzo-gray-600 tracking-wider flex items-center gap-1.5">
            <span className="text-[10px]">🇻🇪</span> VE / EUR €
          </p>
        </div>

        {/* Social icons */}
        <div className="flex items-center gap-5 mb-5">
          <a href="https://www.instagram.com/alonzo.ve/" target="_blank" rel="noopener noreferrer" className="text-alonzo-charcoal hover:text-alonzo-black"><Instagram size={20} /></a>
          <a href="https://www.facebook.com/alonzovenezuela" target="_blank" rel="noopener noreferrer" className="text-alonzo-charcoal hover:text-alonzo-black"><Facebook size={20} /></a>
          <a href="https://www.tiktok.com/@alonzo.ve" target="_blank" rel="noopener noreferrer" className="text-alonzo-charcoal hover:text-alonzo-black">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.27 8.27 0 005.58 2.17v-3.44a4.85 4.85 0 01-3.77-1.27V6.69h3.77z"/></svg>
          </a>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="text-alonzo-charcoal hover:text-alonzo-black">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          </a>
        </div>

        {/* Copyright */}
        <p className="text-[9px] text-alonzo-gray-500 tracking-wider">
          © ALONZO STORE. Venezuela · Todos los derechos reservados.
        </p>
      </div>

      {/* ── Desktop footer ── */}
      <div className="hidden md:block">
      {/* ── Main footer grid ── */}
      <div className="max-w-[1400px] mx-auto px-10 pt-14 pb-10">
        <div className="grid grid-cols-12 gap-8">
          {/* CTA – Join / Rewards */}
          <div className="col-span-4">
            <h3 className="text-xs font-bold tracking-widest text-alonzo-black mb-3">
              ÚNETE A ALONZO PRESTIGE
            </h3>
            <p className="text-2xs text-alonzo-gray-600 tracking-wider leading-relaxed mb-5 max-w-[280px]">
              GANA PUNTOS Y RECOMPENSAS EN TODAS TUS COMPRAS
            </p>
            {client ? (
              <Link
                href="/account"
                className="inline-flex items-center gap-1.5 text-2xs font-semibold tracking-widest text-alonzo-black hover:text-alonzo-accent transition-colors group"
              >
                <ChevronRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                MI CUENTA
              </Link>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="inline-flex items-center gap-1.5 text-2xs font-semibold tracking-widest text-alonzo-black hover:text-alonzo-accent transition-colors group uppercase text-left"
              >
                <ChevronRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                REGÍSTRATE
              </button>
            )}
          </div>

          {/* Dynamic link sections */}
          {footerSections.map((section) => (
            <div key={section.title} className="col-span-3">
              <h4 className="text-xs font-bold tracking-widest text-alonzo-black mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-2xs text-alonzo-gray-600 tracking-wider hover:text-alonzo-black transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-2xs text-alonzo-gray-600 tracking-wider hover:text-alonzo-black transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Social icons */}
          <div className="col-span-2">
            <h4 className="text-xs font-bold tracking-widest text-alonzo-black mb-4">
              SÍGUENOS
            </h4>
            <div className="flex items-center gap-5">
              <a href="https://www.instagram.com/alonzo.ve/" target="_blank" rel="noopener noreferrer" className="text-alonzo-gray-600 hover:text-alonzo-black transition-colors"><Instagram size={20} /></a>
              <a href="https://www.facebook.com/alonzovenezuela" target="_blank" rel="noopener noreferrer" className="text-alonzo-gray-600 hover:text-alonzo-black transition-colors"><Facebook size={20} /></a>
              <a href="https://www.tiktok.com/@alonzo.ve" target="_blank" rel="noopener noreferrer" className="text-alonzo-gray-600 hover:text-alonzo-black transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.27 8.27 0 005.58 2.17v-3.44a4.85 4.85 0 01-3.77-1.27V6.69h3.77z"/></svg>
              </a>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="text-alonzo-gray-600 hover:text-alonzo-black transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </a>
            </div>
          </div>

          {/* Country / region */}
          <div className="col-span-3">
            <h4 className="text-xs font-bold tracking-widest text-alonzo-black mb-4">
              PAÍS
            </h4>
            <p className="text-2xs text-alonzo-gray-600 tracking-wider flex items-center gap-1.5">
              <span className="inline-block w-4 h-4 rounded-full overflow-hidden border border-alonzo-gray-300 flex-shrink-0">
                {/* Venezuela flag emoji fallback */}
                <span className="flex items-center justify-center w-full h-full text-[10px]">🇻🇪</span>
              </span>
              VE / EUR € | ESPAÑOL
            </p>
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-alonzo-gray-200">
        <div className="max-w-[1400px] mx-auto px-10 py-5">
          {/* Copyright line */}
          <p className="text-2xs text-alonzo-gray-500 tracking-wider mb-3">
            © ALONZO STORE. Venezuela&nbsp;&nbsp;·&nbsp;&nbsp;Todos los derechos reservados.
          </p>

          {/* Legal links */}
          <div className="flex flex-wrap gap-x-6 gap-y-1">
            <Link
              href="/terms"
              className="text-2xs text-alonzo-gray-500 tracking-wider hover:text-alonzo-black transition-colors"
            >
              TÉRMINOS Y CONDICIONES
            </Link>
            <Link
              href="/privacy"
              className="text-2xs text-alonzo-gray-500 tracking-wider hover:text-alonzo-black transition-colors"
            >
              POLÍTICA DE PRIVACIDAD
            </Link>
            <Link
              href="/terms"
              className="text-2xs text-alonzo-gray-500 tracking-wider hover:text-alonzo-black transition-colors"
            >
              ENVÍOS Y DEVOLUCIONES
            </Link>
            <Link
              href="/privacy"
              className="text-2xs text-alonzo-gray-500 tracking-wider hover:text-alonzo-black transition-colors"
            >
              COOKIES
            </Link>
          </div>
        </div>
      </div>
      </div>
    </footer>
  );
}

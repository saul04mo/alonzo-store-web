'use client';

import Link from 'next/link';
import { Instagram, Facebook, ChevronRight } from 'lucide-react';
import { useUIStore, useClientStore } from '@/stores';

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '584123380976';

const footerSections = [
  {
    title: 'ATENCIÓN AL CLIENTE',
    links: [
      { label: '● LIVE CHAT', href: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola, necesito ayuda.')}`, external: true },
      { label: 'CENTRO DE AYUDA', href: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Necesito soporte con mi pedido.')}`, external: true },
      { label: 'RASTREAR PEDIDO', href: '/account', external: false },
      { label: 'HACER DEVOLUCIÓN', href: `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Quiero solicitar una devolución.')}`, external: true },
    ],
  },
];

const socialLinks = [
  { icon: 'instagram', href: 'https://www.instagram.com/alonzo.ve/' },
  { icon: 'facebook', href: 'https://www.facebook.com/alonzovenezuela' },
  { icon: 'tiktok', href: 'https://www.tiktok.com/@alonzo.ve' },
];

export function SiteFooter() {
  const setAuthOpen = useUIStore((s) => s.setAuthOpen);
  const client = useClientStore((s) => s.client);

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
            <span className="text-[10px]">🇻🇪</span> VE / USD $
          </p>
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-alonzo-gray-600 tracking-wider">
            📱 WHATSAPP
          </a>
        </div>

        {/* Social icons */}
        <div className="flex items-center gap-5 mb-5">
          <a href="https://www.instagram.com/alonzo.ve/" target="_blank" rel="noopener noreferrer" className="text-alonzo-charcoal hover:text-alonzo-black"><Instagram size={20} /></a>
          <a href="https://www.facebook.com/alonzovenezuela" target="_blank" rel="noopener noreferrer" className="text-alonzo-charcoal hover:text-alonzo-black"><Facebook size={20} /></a>
          <a href="https://www.tiktok.com/@alonzo.ve" target="_blank" rel="noopener noreferrer" className="text-alonzo-charcoal hover:text-alonzo-black">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.27 8.27 0 005.58 2.17v-3.44a4.85 4.85 0 01-3.77-1.27V6.69h3.77z"/></svg>
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
              VE / USD $ | ESPAÑOL
            </p>

            <h4 className="text-xs font-bold tracking-widest text-alonzo-black mt-6 mb-3">
              CONTÁCTANOS
            </h4>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-2xs text-alonzo-gray-600 tracking-wider hover:text-alonzo-black transition-colors"
            >
              📱 WHATSAPP
            </a>
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

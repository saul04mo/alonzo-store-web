'use client';

import { cs } from '@/lib/format';
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
            <span className="text-[10px]">🇻🇪</span> VE / VE | {cs()}
          </p>
        </div>

        {/* Social icons */}
        <div className="flex items-center gap-7 mb-5">
          <a
            href="https://www.instagram.com/alonzo.ve/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-alonzo-charcoal hover:text-alonzo-black flex items-center justify-center w-6 h-6"
          >
            <Instagram size={20} strokeWidth={1.5} />
          </a>
          <a
            href="https://www.facebook.com/alonzovenezuela"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="text-alonzo-charcoal hover:text-alonzo-black flex items-center justify-center w-6 h-6"
          >
            <Facebook size={20} strokeWidth={1.5} />
          </a>
          <a
            href="https://www.tiktok.com/@alonzo.ve"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="TikTok"
            className="text-alonzo-charcoal hover:text-alonzo-black flex items-center justify-center w-6 h-6"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
            </svg>
          </a>
          <a
            href={`https://wa.me/${whatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
            className="text-alonzo-charcoal hover:text-alonzo-black flex items-center justify-center w-6 h-6"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
            </svg>
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
                className="inline-flex items-center gap-1.5 text-2xs font-semibold tracking-widest text-alonzo-black hover:text-alonzo-gray-600 transition-colors group"
              >
                <ChevronRight size={12} className="transition-transform group-hover:translate-x-0.5" />
                MI CUENTA
              </Link>
            ) : (
              <button
                onClick={() => setAuthOpen(true)}
                className="inline-flex items-center gap-1.5 text-2xs font-semibold tracking-widest text-alonzo-black hover:text-alonzo-gray-600 transition-colors group uppercase text-left"
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
            <div className="flex items-center gap-6">
              <a
                href="https://www.instagram.com/alonzo.ve/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-alonzo-gray-600 hover:text-alonzo-black transition-colors flex items-center justify-center w-6 h-6"
              >
                <Instagram size={20} strokeWidth={1.5} />
              </a>
              <a
                href="https://www.facebook.com/alonzovenezuela"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-alonzo-gray-600 hover:text-alonzo-black transition-colors flex items-center justify-center w-6 h-6"
              >
                <Facebook size={20} strokeWidth={1.5} />
              </a>
              <a
                href="https://www.tiktok.com/@alonzo.ve"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="text-alonzo-gray-600 hover:text-alonzo-black transition-colors flex items-center justify-center w-6 h-6"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
                </svg>
              </a>
              <a
                href={`https://wa.me/${whatsappNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="text-alonzo-gray-600 hover:text-alonzo-black transition-colors flex items-center justify-center w-6 h-6"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                </svg>
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
              VE / VE | {cs()} | ESPAÑOL
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

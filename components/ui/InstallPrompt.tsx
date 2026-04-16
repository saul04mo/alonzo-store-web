'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Download, Share } from 'lucide-react';
import { useWebSettings } from '@/lib/useWebSettings';

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | null>(null);
  const { installPromptEnabled } = useWebSettings();
  const promptRef = useRef<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (!installPromptEnabled) return;
    if (sessionStorage.getItem('alonzo-pwa-dismissed')) return;
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if ((window.navigator as any).standalone === true) return;

    const ua = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);

    if (isIos) {
      setPlatform('ios');
      setTimeout(() => setShow(true), 3000);
    } else if (isAndroid) {
      setPlatform('android');
      const handler = (e: Event) => { e.preventDefault(); promptRef.current = e; };
      window.addEventListener('beforeinstallprompt', handler);
      setTimeout(() => setShow(true), 3000);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    } else {
      setPlatform('desktop');
      const handler = (e: Event) => { e.preventDefault(); promptRef.current = e; setShow(true); };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, [installPromptEnabled]);

  const handleInstall = async () => {
    if (promptRef.current) {
      try {
        promptRef.current.prompt();
        const result = await promptRef.current.userChoice;
        if (result.outcome === 'accepted') { setInstalled(true); setTimeout(() => handleDismiss(), 2000); return; }
      } catch {}
    }
  };

  const handleDismiss = () => { setShow(false); sessionStorage.setItem('alonzo-pwa-dismissed', '1'); };

  if (!show) return null;

  if (installed) {
    return (
      <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[340px] z-[85] animate-slide-up">
        <div className="bg-emerald-600 rounded-xl shadow-xl p-4 text-center text-white text-sm font-medium">
          ¡ALONZO instalada correctamente!
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[340px] z-[85] animate-slide-up">
      <div className="bg-white rounded-xl shadow-xl border border-alonzo-gray-200 p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-alonzo-black flex items-center justify-center shrink-0">
          <img src="/icons/icon-96x96.png" alt="ALONZO" className="w-7 h-7 object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-alonzo-charcoal">Instalar ALONZO</p>
          {platform === 'ios' && (
            <p className="text-[11px] text-alonzo-gray-500 mt-1 leading-relaxed">
              Toca <Share size={13} className="inline -mt-0.5 text-blue-500" /> y luego <strong>"Agregar a inicio"</strong>
            </p>
          )}
          {platform === 'android' && (
            <>
              <p className="text-[11px] text-alonzo-gray-500 mt-0.5">Accede rápido desde tu pantalla de inicio</p>
              <button onClick={handleInstall} className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-alonzo-black text-white text-[10px] tracking-[0.1em] uppercase font-semibold rounded-md hover:bg-alonzo-charcoal transition-colors active:scale-95">
                <Download size={12} /> Instalar
              </button>
              {!promptRef.current && <p className="text-[10px] text-alonzo-gray-400 mt-2">O toca <strong>⋮</strong> → <strong>"Instalar app"</strong></p>}
            </>
          )}
          {platform === 'desktop' && (
            <>
              <p className="text-[11px] text-alonzo-gray-500 mt-0.5">Accede rápido desde tu escritorio</p>
              <button onClick={handleInstall} className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-alonzo-black text-white text-[10px] tracking-[0.1em] uppercase font-semibold rounded-md hover:bg-alonzo-charcoal transition-colors active:scale-95">
                <Download size={12} /> Instalar
              </button>
            </>
          )}
        </div>
        <button onClick={handleDismiss} className="text-alonzo-gray-400 hover:text-alonzo-black transition-colors shrink-0 p-1">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

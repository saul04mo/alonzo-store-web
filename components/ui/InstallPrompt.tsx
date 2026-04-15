'use client';
import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if already dismissed in this session
    if (sessionStorage.getItem('alonzo-pwa-dismissed')) {
      setDismissed(true);
      return;
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    // iOS detection (no beforeinstallprompt)
    const ua = navigator.userAgent;
    const isIosDevice = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    const isSafari = /Safari/.test(ua) && !/Chrome/.test(ua);
    if (isIosDevice && isSafari) {
      setIsIos(true);
      return;
    }

    // Chrome/Edge/Samsung — listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
    handleDismiss();
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('alonzo-pwa-dismissed', '1');
  };

  // Don't show if dismissed, already installed, or no prompt available
  if (dismissed) return null;
  if (!deferredPrompt && !isIos) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[340px] z-[85] animate-slide-up">
      <div className="bg-white rounded-xl shadow-xl border border-alonzo-gray-200 p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-alonzo-black flex items-center justify-center shrink-0">
          <img src="/icons/icon-96x96.png" alt="ALONZO" className="w-7 h-7 object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-alonzo-charcoal">Instalar ALONZO</p>
          {isIos ? (
            <p className="text-[11px] text-alonzo-gray-500 mt-0.5 leading-relaxed">
              Toca <span className="inline-block w-4 h-4 align-text-bottom">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="w-full h-full">
                  <path d="M12 5v14M5 12l7-7 7 7"/><rect x="3" y="15" width="18" height="6" rx="2"/>
                </svg>
              </span> y luego <strong>"Agregar a inicio"</strong>
            </p>
          ) : (
            <>
              <p className="text-[11px] text-alonzo-gray-500 mt-0.5">Accede rápido desde tu pantalla de inicio</p>
              <button
                onClick={handleInstall}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-alonzo-black text-white text-[10px] tracking-[0.1em] uppercase font-semibold rounded-md hover:bg-alonzo-charcoal transition-colors"
              >
                <Download size={12} />
                Instalar
              </button>
            </>
          )}
        </div>
        <button onClick={handleDismiss} className="text-alonzo-gray-400 hover:text-alonzo-black transition-colors shrink-0">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

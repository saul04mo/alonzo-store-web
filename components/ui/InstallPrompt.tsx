'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Download, Share } from 'lucide-react';
import { db, doc, getDoc } from '@/lib/firebase-client';

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const promptRef = useRef<any>(null);

  // Check if feature is enabled in Firestore
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'webSettings'));
        if (snap.exists() && snap.data().installPromptEnabled === false) {
          setEnabled(false);
        } else {
          setEnabled(true);
        }
      } catch {
        setEnabled(true); // Default to enabled if can't read
      }
    })();
  }, []);

  useEffect(() => {
    // Wait until we know if it's enabled
    if (enabled !== true) return;

    // Don't show if already dismissed
    if (sessionStorage.getItem('alonzo-pwa-dismissed')) return;

    // Don't show if already installed as PWA
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if ((window.navigator as any).standalone === true) return;

    // Detect iOS
    const isIosDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    if (isIosDevice) {
      const timer = setTimeout(() => {
        setIsIos(true);
        setShow(true);
      }, 3000);
      return () => clearTimeout(timer);
    }

    // Android/Chrome
    const handler = (e: Event) => {
      e.preventDefault();
      promptRef.current = e;
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [enabled]);

  const handleInstall = async () => {
    const prompt = promptRef.current;
    if (!prompt) return;
    try {
      prompt.prompt();
      const result = await prompt.userChoice;
      if (result.outcome === 'accepted') {
        promptRef.current = null;
      }
    } catch (e) {
      console.error('Install error:', e);
    }
    handleDismiss();
  };

  const handleDismiss = () => {
    setShow(false);
    sessionStorage.setItem('alonzo-pwa-dismissed', '1');
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-[340px] z-[85] animate-slide-up">
      <div className="bg-white rounded-xl shadow-xl border border-alonzo-gray-200 p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-alonzo-black flex items-center justify-center shrink-0">
          <img src="/icons/icon-96x96.png" alt="ALONZO" className="w-7 h-7 object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[12px] font-semibold text-alonzo-charcoal">Instalar ALONZO</p>
          {isIos ? (
            <p className="text-[11px] text-alonzo-gray-500 mt-1 leading-relaxed">
              Toca <Share size={13} className="inline -mt-0.5 text-blue-500" /> y luego <strong>"Agregar a inicio"</strong>
            </p>
          ) : (
            <>
              <p className="text-[11px] text-alonzo-gray-500 mt-0.5">Accede rápido desde tu pantalla de inicio</p>
              <button
                onClick={handleInstall}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-alonzo-black text-white text-[10px] tracking-[0.1em] uppercase font-semibold rounded-md hover:bg-alonzo-charcoal transition-colors active:scale-95"
              >
                <Download size={12} />
                Instalar
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

'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Download, Share } from 'lucide-react';
import { useWebSettings } from '@/lib/useWebSettings';

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | null>(null);
  const { installPromptEnabled, loaded } = useWebSettings();
  const promptRef = useRef<any>(null);
  const [installed, setInstalled] = useState(false);

  // Listener GLOBAL que silencia el mini-infobar nativo de Chrome
  // Android. Sin este preventDefault(), Chrome muestra su propio
  // prompt de instalaci\u00f3n estilo Android (en el borde inferior, fuera
  // del control del sitio) cuando detecta que el sitio cumple con
  // los criterios de PWA. Lo capturamos y prevenimos siempre, incluso
  // con el toggle apagado, para que NUNCA aparezca ese prompt nativo.
  // Si el toggle est\u00e1 activado, despu\u00e9s mostramos NUESTRO banner
  // custom (el otro useEffect abajo).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = (e: Event) => {
      e.preventDefault();
      promptRef.current = e;
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    // Esperar a que las settings se hayan cargado de Firestore.
    // Si arrancamos antes de eso, el flag default es false y no
    // mostramos nada (defensivo).
    if (!loaded) return;
    // Respetar el toggle del admin: si est\u00e1 apagado en Firestore, NO
    // mostramos el banner bajo ning\u00fan caso (ni iOS ni Android ni desktop).
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
      // El listener global de arriba ya captur\u00f3 el evento si
      // existi\u00f3. Solo mostramos nuestro banner custom.
      setTimeout(() => setShow(true), 3000);
    } else {
      setPlatform('desktop');
      // En desktop, si Chrome ya capt\u00f3 el evento (listener global),
      // mostramos el banner. Si todav\u00eda no captur\u00f3, esperamos.
      if (promptRef.current) {
        setShow(true);
      } else {
        // Re-attach un listener temporal solo para mostrar el banner
        // cuando llegue el evento (puede llegar despu\u00e9s del primer
        // listener si el sitio recarga).
        const showWhenReady = () => setShow(true);
        window.addEventListener('beforeinstallprompt', showWhenReady, { once: true });
        return () => window.removeEventListener('beforeinstallprompt', showWhenReady);
      }
    }
  }, [installPromptEnabled, loaded]);

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

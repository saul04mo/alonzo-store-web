'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  auth,
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from '@/lib/firebase-client';
import { useClientStore } from '@/stores';
import { Client } from '@/types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { useToast } from '@/components/ui';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AuthModal({ open, onClose, onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rifCi, setRifCi] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { setClient } = useClientStore();
  const toast = useToast();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  const handleAuthError = (error: any) => {
    console.error('Auth error:', error);
    let message = 'Ocurrió un error de autenticación.';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      message = 'Credenciales inválidas.';
    } else if (error.code === 'auth/email-already-in-use') {
      message = 'El correo ya está registrado.';
    }
    toast.show(message);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userRef = doc(db, 'clients', user.uid);
      const userSnap = await getDoc(userRef);
      
      let clientData: Client;
      
      if (userSnap.exists()) {
        clientData = userSnap.data() as Client;
      } else {
        clientData = {
          id: user.uid,
          name: user.displayName || 'Usuario',
          email: user.email || '',
          phone: '',
          address: '',
          rif_ci: '',
        };
        await setDoc(userRef, clientData);
      }
      
      setClient(clientData);
      onSuccess();
      onClose();
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    if (!isLogin && !name) return;

    // FIX #19: Validate password length client-side
    if (password.length < 6) {
      toast.show('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.show('Ingresa un correo electrónico válido.');
      return;
    }

    setIsLoading(true);
    try {
      if (isLogin) {
        const result = await signInWithEmailAndPassword(auth, email, password);
        const userRef = doc(db, 'clients', result.user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setClient(userSnap.data() as Client);
        } else {
          setClient({
            id: result.user.uid,
            name: 'Usuario',
            email: result.user.email || '',
            phone: '',
            address: '',
            rif_ci: '',
          });
        }
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        const clientData: Client = {
          id: result.user.uid,
          name: name,
          email: result.user.email || '',
          phone: phone,
          address: address,
          rif_ci: rifCi,
        };
        await setDoc(doc(db, 'clients', result.user.uid), clientData);
        setClient(clientData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/40 z-[5000] transition-opacity animate-fade-in backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="fixed inset-0 z-[5010] flex items-center justify-center p-4">
        <div className="w-full max-w-[440px] bg-white shadow-2xl flex flex-col transition-all duration-300 animate-fade-in relative font-sans rounded-sm">
          {/* Header Modal - Estilo Farfetch */}
          <div className="flex items-center justify-between p-6 relative">
            <h2 className="text-xl font-medium text-[#222] font-sans">
              {isLogin ? 'Entra en ALONZO' : 'Regístrate en ALONZO'}
            </h2>
            <button 
              onClick={onClose}
              className="text-[#222] hover:opacity-70 transition-opacity"
            >
              <svg width="18" height="18" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 pb-10 flex flex-col font-sans">
            
            {/* Tabs - Estilo Farfetch */}
            <div className="flex gap-8 mb-8 border-b border-gray-100">
              <button
                className={`pb-4 text-[13px] font-semibold tracking-wider transition-all relative ${isLogin ? 'text-black' : 'text-gray-400 hover:text-black'}`}
                onClick={() => setIsLogin(true)}
              >
                INICIA SESIÓN
                {isLogin && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />}
              </button>
              <button
                className={`pb-4 text-[13px] font-semibold tracking-wider transition-all relative ${!isLogin ? 'text-black' : 'text-gray-400 hover:text-black'}`}
                onClick={() => setIsLogin(false)}
              >
                REGÍSTRATE
                {!isLogin && <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black" />}
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleEmailAuth} className="space-y-5 mb-6">
              {!isLogin && (
                <>
                  <div>
                    <label className="text-[13px] text-[#222] block mb-2">Nombre</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 focus:border-black bg-white text-sm py-3 px-3 outline-none transition-colors rounded-sm"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required={!isLogin}
                    />
                  </div>
                  <div>
                    <label className="text-[13px] text-[#222] block mb-2">RIF / CI (Identificación)</label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 focus:border-black bg-white text-sm py-3 px-3 outline-none transition-colors rounded-sm"
                      value={rifCi}
                      onChange={(e) => setRifCi(e.target.value)}
                      required={!isLogin}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[13px] text-[#222] block mb-2">Teléfono</label>
                      <input
                        type="tel"
                        className="w-full border border-gray-300 focus:border-black bg-white text-sm py-3 px-3 outline-none transition-colors rounded-sm"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required={!isLogin}
                      />
                    </div>
                    <div>
                      <label className="text-[13px] text-[#222] block mb-2">Dirección</label>
                      <input
                        type="text"
                        className="w-full border border-gray-300 focus:border-black bg-white text-sm py-3 px-3 outline-none transition-colors rounded-sm"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required={!isLogin}
                      />
                    </div>
                  </div>
                </>
              )}
              
              <div>
                <label className="text-[13px] text-[#222] block mb-2">Dirección de correo electrónico</label>
                <input
                  type="email"
                  className="w-full border border-gray-300 focus:border-black bg-white text-sm py-3 px-3 outline-none transition-colors rounded-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <label className="text-[13px] text-[#222] block mb-2">Contraseña</label>
                <input
                  type="password"
                  className="w-full border border-gray-300 focus:border-black bg-white text-sm py-3 px-3 outline-none transition-colors rounded-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder={isLogin ? '' : 'Mínimo 6 caracteres'}
                />
                {isLogin && (
                  <button
                    type="button"
                    className="mt-3 text-[13px] text-[#222] underline hover:no-underline"
                    onClick={async () => {
                      if (!email) { toast.show('Ingresa tu correo primero.'); return; }
                      try {
                        const { sendPasswordResetEmail } = await import('firebase/auth');
                        await sendPasswordResetEmail(auth, email);
                        toast.show('Correo de recuperación enviado.');
                      } catch {
                        toast.show('Error al enviar correo de recuperación.');
                      }
                    }}
                  >
                    ¿Has olvidado tu contraseña?
                  </button>
                )}
              </div>

              {!isLogin && (
                <p className="text-[11px] text-gray-500 leading-relaxed mt-2 uppercase tracking-tight">
                  Al registrarte, aceptas nuestros{' '}
                  <Link href="/terms" onClick={onClose} className="underline hover:text-black">
                    Términos y Condiciones
                  </Link>
                  ,{' '}
                  <Link href="/privacy" onClick={onClose} className="underline hover:text-black">
                    Política de Privacidad y de Cookies
                  </Link>{' '}
                  y unirte a nuestro programa de lealtad.
                </p>
              )}

              <button
                type="submit"
                className="w-full py-4 mt-4 bg-[#222] text-white text-sm font-bold hover:bg-black transition-colors rounded-sm uppercase tracking-wider"
                disabled={isLoading}
              >
                {isLoading ? '...' : isLogin ? 'Inicia sesión' : 'Regístrate'}
              </button>
            </form>

            {/* Separator */}
            <div className="flex justify-center items-center mb-6">
              <span className="text-[15px] text-gray-400 font-serif lowercase italic">o</span>
            </div>

            {/* Social - Estilo Farfetch */}
            <div className="space-y-4">
              <button
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-3.5 border border-gray-300 font-sans flex items-center justify-center gap-4 text-[14px] text-[#222] hover:bg-gray-50 transition-colors bg-white font-medium rounded-sm"
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
                Continuar con Google
              </button>
              
              {isLogin && (
                <div className="text-center mt-6">
                  <button 
                    onClick={() => setIsLogin(false)}
                    className="text-[13px] text-[#222] underline hover:no-underline"
                  >
                    ¿Es tu primera vez en ALONZO? Regístrate.
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

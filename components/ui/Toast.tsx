'use client';
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface ToastContextType {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({ show: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);

  const show = useCallback((msg: string) => {
    setMessage(msg);
    setVisible(true);
    setTimeout(() => setVisible(false), 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div
        className={`
          fixed z-[9999] left-1/2 bottom-24 -translate-x-1/2
          min-w-[200px] bg-alonzo-dark text-white text-center
          py-3.5 px-5 text-xs tracking-wider uppercase
          shadow-lg transition-all duration-400
          ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}
        `}
      >
        {message}
      </div>
    </ToastContext.Provider>
  );
}

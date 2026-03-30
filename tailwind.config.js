/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        display: ['var(--font-inter)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      colors: {
        alonzo: {
          black: '#0a0a0a',
          dark: '#1a1a1a',
          charcoal: '#333333',
          gray: {
            100: '#fafafa',
            200: '#f5f5f5',
            300: '#eeeeee',
            400: '#cccccc',
            500: '#999999',
            600: '#666666',
            700: '#444444',
          },
          accent: '#c9a96e',
          success: '#2ecc71',
          danger: '#d9665a',
          warning: '#f39c12',
        },
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],     // 10px
        xs: ['0.6875rem', { lineHeight: '1rem' }],            // 11px
        sm: ['0.75rem', { lineHeight: '1.125rem' }],          // 12px
        base: ['0.8125rem', { lineHeight: '1.25rem' }],       // 13px
        lg: ['0.875rem', { lineHeight: '1.375rem' }],         // 14px
      },
      letterSpacing: {
        wide: '0.05em',
        wider: '0.1em',
        widest: '0.15em',
      },
      maxWidth: {
        app: '450px',
        'app-wide': '1200px',
      },
      animation: {
        'shimmer': 'shimmer 2s infinite',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        'slide-down': 'slideDown 0.3s ease forwards',
        'fade-in': 'fadeIn 0.3s ease',
        'toast': 'toastIn 0.4s ease',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        toastIn: {
          from: { opacity: '0', transform: 'translateX(-50%) translateY(10px)' },
          to: { opacity: '1', transform: 'translateX(-50%) translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // OJO con el valor por defecto dentro del var(): NO es decorativo.
      // Si --font-inter no está definida, CSS invalida la declaración
      // ENTERA (invalid at computed-value time) en vez de saltar al
      // siguiente item de la lista — y font-family cae a su valor
      // inicial, o sea la serif del navegador (Times New Roman). Pasó en
      // producción dos veces: el build desplegado sirvió el HTML con la
      // clase __variable_8c3f94 y el CSS con .__variable_fa2f99, la
      // variable quedó sin definir y TODO el texto de cuerpo se fue a
      // Times. Con el default el peor caso es system-ui.
      fontFamily: {
        sans: ['var(--font-inter, system-ui)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif'],
        // Sans-serif condensada estilo streetwear/fashion editorial
        // (Bebas Neue). Se usa en títulos del hero. Si en el futuro
        // se cambia la marca a otra fuente similar (Oswald, Antonio,
        // Barlow Condensed), basta con cambiar la variable
        // --font-bebas en layout.tsx.
        editorial: ['var(--font-bebas, Impact)', 'Impact', '"Helvetica Neue Condensed"', 'Arial Narrow', 'sans-serif'],
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

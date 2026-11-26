/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      borderRadius: {
        xl: '0.5rem',
        '2xl': '0.625rem',
        '3xl': '0.875rem',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.35s ease-out both',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'Cambria', '"Times New Roman"', 'serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        display: ['"Playfair Display"', 'serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        farm: {
          sky: '#1e88e5',
          'sky-dark': '#0284c7',
          'sky-light': '#38bdf8',
          'sky-pale': '#e0f2fe',
          green: '#16a34a',
          'green-dark': '#15803d',
          'green-forest': '#0f2b1d',
          'green-pale': '#f0fdf4',
          gold: '#eab308',
          'gold-dark': '#ca8a04',
          'gold-pale': '#fef9c3',
          coral: '#ea580c',
          'coral-hover': '#c2410c',
          navy: '#0f172a',
          'navy-card': '#1e293b',
          cream: '#fdfbf7',
          sand: '#f5f0e8'
        },
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        civic: {
          forest: '#0f2b1d',
          'forest-dark': '#091c13',
          'forest-light': '#18422e',
          'forest-card': '#123323',
          cream: '#f6f3eb',
          'cream-light': '#faf8f4',
          'cream-dark': '#ede7da',
          ochre: '#e5b03c',
          'ochre-light': '#f3c764',
          'ochre-dark': '#cc9624',
          slate: '#243b2f',
          muted: '#8ba696'
        },
        slate: {
          50: '#f6f3eb', 100: '#efeadd', 200: '#e1dbc8', 300: '#cdc6af', 400: '#8b9b90',
          500: '#66786d', 600: '#4b5f53', 700: '#2f4a3a', 800: '#1b3b2a', 850: '#123323',
          900: '#0f2b1d', 950: '#091c13',
        },
        stone: {
          50: '#f6f3eb', 100: '#efeadd', 200: '#e1dbc8', 300: '#cdc6af', 400: '#8b9b90',
          500: '#66786d', 600: '#4b5f53', 700: '#2f4a3a', 800: '#1b3b2a', 850: '#123323',
          900: '#0f2b1d', 950: '#091c13',
        },
        gray: {
          50: '#f6f3eb', 100: '#efeadd', 200: '#e1dbc8', 300: '#cdc6af', 400: '#8b9b90',
          500: '#66786d', 600: '#4b5f53', 700: '#2f4a3a', 800: '#1b3b2a', 850: '#123323',
          900: '#0f2b1d', 950: '#091c13',
        },
        emerald: {
          50: '#eef5ef', 100: '#dcebdf', 200: '#bcd9c4', 300: '#8fc0a0', 400: '#6dae87',
          500: '#2f7d57', 600: '#1d5a3d', 700: '#17482f', 800: '#123a27', 900: '#0f2b1d', 950: '#091c13',
        },
        amber: {
          50: '#fbf5e4', 100: '#f6e9c3', 200: '#f0da98', 300: '#f3c764', 400: '#e5b03c',
          500: '#cc9624', 600: '#a87a18', 700: '#86600f', 800: '#6a4c0e', 900: '#4f390c', 950: '#2f2206',
        },
      }
    },
  },
  plugins: [],
}

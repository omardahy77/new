/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
      },
      colors: {
        gold: {
          400: '#FFD700',
          500: '#FFC400',
          600: '#B38F00',
        },
        navy: {
          // New Bluish-Navy Palette (Midnight Blue)
          800: '#162032', // Lighter navy for hover states
          900: '#0C1220', // Deep navy for cards/sidebars
          950: '#040711', // Darkest navy (Background base) - Leaning towards blue, not black
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scroll': 'scroll 40s linear infinite',
        'shine': 'shine 1.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        shine: {
          '0%': { left: '-100%' },
          '100%': { left: '200%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #FFD700 0%, #FFC400 50%, #E6B800 100%)',
        'navy-gradient': 'linear-gradient(to bottom, #0C1220, #040711)',
      }
    },
  },
  plugins: [],
}

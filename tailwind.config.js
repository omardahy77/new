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
          600: '#E6B800',
        },
        navy: {
          800: '#0f172a',
          900: '#020617',
          950: '#01030b',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scroll': 'scroll 60s linear infinite', // Increased duration for smoother speed
        'shine': 'shine 1.5s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scroll: {
          '0%': { transform: 'translateX(-50%)' }, // Start from left (halfway because of duplication)
          '100%': { transform: 'translateX(0)' },   // Move to right
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
      }
    },
  },
  plugins: [],
}

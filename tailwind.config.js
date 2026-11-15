/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Fredoka"', '"Nunito"', 'ui-rounded', 'system-ui', 'sans-serif'],
      },
      gridTemplateColumns: {
        '13': 'repeat(13, minmax(0, 1fr))',
      },
      gridTemplateRows: {
        '13': 'repeat(13, minmax(0, 1fr))',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '50%': { transform: 'scale(1.08)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-6px)' },
          '40%, 80%': { transform: 'translateX(6px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      },
      animation: {
        pop: 'pop 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        shake: 'shake 0.35s ease-in-out',
        float: 'float 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}

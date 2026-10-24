/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'reel': {
          pink: '#FE2C55',
          cyan: '#25F4EE',
          dark: '#121212',
          darker: '#0a0a0a',
          gray: '#1f1f1f',
          'gray-light': '#2f2f2f',
          'text-muted': '#8a8a8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'heart-burst': 'heartBurst 0.6s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-in',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'spin-slow': 'spin 4s linear infinite',
        'pulse-pink': 'pulsePink 1s ease-in-out infinite',
      },
      keyframes: {
        heartBurst: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.4)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          from: { transform: 'translateY(-20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        pulsePink: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(254,44,85,0.4)' },
          '50%': { boxShadow: '0 0 0 8px rgba(254,44,85,0)' },
        },
      },
    },
  },
  plugins: [],
}

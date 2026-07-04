export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        stampIn: {
          '0%':   { transform: 'scale(2.2) rotate(-8deg)', opacity: '0' },
          '55%':  { transform: 'scale(0.93) rotate(-4deg)', opacity: '1' },
          '75%':  { transform: 'scale(1.04) rotate(-4deg)' },
          '100%': { transform: 'scale(1) rotate(-4deg)', opacity: '1' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(100%)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'stamp-in': 'stampIn 380ms cubic-bezier(0.15, 0.9, 0.3, 1.2) both',
        'fade-up':  'fadeUp 200ms ease-out both',
        'slide-up': 'slideUp 280ms cubic-bezier(0.2, 0.9, 0.4, 1) both',
      },
    },
  },
  plugins: [],
};
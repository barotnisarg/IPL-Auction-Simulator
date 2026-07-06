export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        // ── Existing ──────────────────────────────────────────────────────
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
        cardEnter: {
          '0%':   { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
          '60%':  { opacity: '1', transform: 'translateY(-2px) scale(1.005)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        bidFlash: {
          '0%':   { color: 'rgb(251 191 36)', transform: 'scale(1)' },
          '30%':  { color: 'rgb(255 255 255)', transform: 'scale(1.12)' },
          '100%': { color: 'rgb(251 191 36)', transform: 'scale(1)' },
        },
        timerShake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%':      { transform: 'translateX(-3px)' },
          '40%':      { transform: 'translateX(3px)' },
          '60%':      { transform: 'translateX(-2px)' },
          '80%':      { transform: 'translateX(2px)' },
        },
        rowEnter: {
          '0%':   { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        numPop: {
          '0%':   { opacity: '0', transform: 'scale(0.7)' },
          '70%':  { opacity: '1', transform: 'scale(1.08)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        ticker: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.7' },
        },

        // ── New — SOLD Impact Sequence ───────────────────────────────────
        // A single confetti particle's fall. Each particle sets its own
        // --fall-y, --spin, --drift-x custom properties inline so ~50
        // particles all look randomized while sharing one keyframe.
        confettiFall: {
          '0%': {
            transform: 'translate(0, 0) rotate(0deg)',
            opacity: '1',
          },
          '80%': {
            opacity: '1',
          },
          '100%': {
            transform: 'translate(var(--drift-x, 0), var(--fall-y, 300px)) rotate(var(--spin, 360deg))',
            opacity: '0',
          },
        },
        // Expanding ring — the "impact" shockwave radiating from the stamp.
        shockwave: {
          '0%':   { transform: 'scale(0.3)', opacity: '0.7', borderWidth: '3px' },
          '100%': { transform: 'scale(2.6)', opacity: '0',   borderWidth: '0.5px' },
        },
        // Full-card radial flash — the punch behind the stamp landing.
        screenFlash: {
          '0%':   { opacity: '0.55' },
          '100%': { opacity: '0' },
        },
        // Sharper than timerShake — a real "impact" jolt, used once on landing.
        impactShake: {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '15%':      { transform: 'translate(-4px, 1px) rotate(-0.5deg)' },
          '30%':      { transform: 'translate(4px, -1px) rotate(0.5deg)' },
          '45%':      { transform: 'translate(-3px, 1px)' },
          '60%':      { transform: 'translate(3px, -1px)' },
          '75%':      { transform: 'translate(-1px, 0)' },
        },
      },
      animation: {
        // ── Existing ──────────────────────────────────────────────────────
        'stamp-in':    'stampIn 380ms cubic-bezier(0.15, 0.9, 0.3, 1.2) both',
        'fade-up':     'fadeUp 200ms ease-out both',
        'slide-up':    'slideUp 280ms cubic-bezier(0.2, 0.9, 0.4, 1) both',
        'card-enter':  'cardEnter 350ms cubic-bezier(0.2, 0.9, 0.35, 1.1) both',
        'bid-flash':   'bidFlash 220ms ease-out both',
        'timer-shake': 'timerShake 400ms ease-in-out',
        'row-enter':   'rowEnter 250ms ease-out both',
        'num-pop':     'numPop 400ms cubic-bezier(0.2, 0.9, 0.3, 1.1) both',
        'ticker':      'ticker 2400ms ease-in-out infinite',

        // ── New ───────────────────────────────────────────────────────────
        // Duration is intentionally randomized per-particle via inline style
        // (animationDuration), so this base duration is just a fallback.
        'confetti-fall': 'confettiFall 1400ms cubic-bezier(0.15, 0.5, 0.4, 1) both',
        // Three rings stagger their delay in the component itself.
        'shockwave':     'shockwave 700ms cubic-bezier(0.15, 0.6, 0.4, 1) both',
        'screen-flash':  'screenFlash 350ms ease-out both',
        'impact-shake':  'impactShake 380ms ease-in-out both',
      },
    },
  },
  plugins: [],
};
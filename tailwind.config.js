/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#01040f',
          900: '#020619',
          850: '#050b22',
          800: '#0a1027',
          750: '#0e1633',
          700: '#131c40',
          600: '#1b2657',
          500: '#24316d',
        },
        glow: {
          100: '#e8f0ff',
          200: '#c5d9ff',
          300: '#9ec1ff',
          400: '#6f9bff',
          500: '#4d7cff',
          600: '#2f5fe0',
        },
        mint: '#34d399',
        amber: '#fbbf24',
        rose: '#f472b6',
        violet: '#a78bfa',
        cyan: '#22d3ee',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Inter Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Space Grotesk"', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.045em',
      },
      boxShadow: {
        panel: '0 24px 80px -32px rgba(77, 124, 255, 0.45), 0 2px 0 0 rgba(255,255,255,0.04) inset',
        lift: '0 18px 60px -28px rgba(77,124,255,0.55)',
        arc: '0 0 60px 4px rgba(120,165,255,0.55), 0 0 140px 30px rgba(60,110,255,0.35)',
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '0.15' },
          '50%': { opacity: '0.9' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.55', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.02)' },
        },
        rise: {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        sheen: {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        twinkle: 'twinkle 4s ease-in-out infinite',
        breathe: 'breathe 7s ease-in-out infinite',
        rise: 'rise 0.6s cubic-bezier(0.22,1,0.36,1) both',
        sheen: 'sheen 3.5s linear infinite',
      },
    },
  },
  plugins: [],
};

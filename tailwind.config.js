/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#05070A',
        mint: { DEFAULT: '#3DFFB5', deep: '#00F5A0', dim: '#1E8A63' },
        cyan: { hud: '#3CD7FF' },
        violet: { hud: '#8B6CFF' },
        ink: { DEFAULT: '#E4F5EE', muted: '#8AA39A', faint: '#56695F' },
      },
      fontFamily: {
        display: ['"Sora Variable"', 'Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', '"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      screens: { xs: '420px' },
    },
  },
  plugins: [],
};

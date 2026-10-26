import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Statischer Build für GitHub Pages / Cloudflare Pages unter der Apex-Domain (base "/").
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // GSAP + Lenis in einen eigenen Chunk: ändern sich selten, gut cachebar.
        manualChunks: { motion: ['gsap', 'gsap/ScrollTrigger', 'lenis'], react: ['react', 'react-dom'] },
      },
    },
  },
});

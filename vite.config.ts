import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

// Füllt <!--PROJECT_LINKS--> im <noscript> mit den Projekten aus public/data/repos.json
// (für Crawler, Link-Vorschauen und Besucher ohne JavaScript).
const noscriptLinks = () => ({
  name: 'noscript-project-links',
  transformIndexHtml(html: string) {
    let items = '';
    try {
      const data = JSON.parse(readFileSync('public/data/repos.json', 'utf8'));
      const esc = (x: string) => x.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
      items = (data.projects ?? [])
        .map((p: { title: string; url?: string | null; repoUrl: string; description?: { de?: string } }) => {
          const d = p.description?.de ? ` – ${esc(p.description.de)}` : '';
          return `<li><a style="color:#3DFFB5" href="${esc(p.url || p.repoUrl)}">${esc(p.title)}</a>${d}</li>`;
        })
        .join('');
    } catch {
      /* ohne Daten bleibt nur der GitHub-Link */
    }
    return html.replace('<!--PROJECT_LINKS-->', items ? `<ul style="line-height:1.8">${items}</ul>` : '');
  },
});

// Statischer Build für GitHub Pages / Cloudflare Pages unter der Apex-Domain (base "/").
export default defineConfig({
  plugins: [react(), noscriptLinks()],
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

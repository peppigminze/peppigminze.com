#!/usr/bin/env node
/**
 * Erzeugt Favicons (SVG/PNG) und das OpenGraph-Bild (1200×630).
 * Einmalig lokal ausführen: npm run assets  (braucht Playwright-Chromium für das OG-Bild)
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUB = path.join(ROOT, 'public');

const LEAF = [
  '......####',
  '....######',
  '...#######',
  '..#####.##',
  '.#####.##.',
  '.####.###.',
  '.###.###..',
  '.##.###...',
  '..###.....',
  '##........',
];
const color = (x, y) => (y > 7 && x < 3 ? '#1E8A63' : x + y < 9 ? '#3DFFB5' : '#00F5A0');
const rects = (ox, oy) =>
  LEAF.flatMap((row, y) => row.split('').map((c, x) => (c === '#' ? `<rect x="${ox + x}" y="${oy + y}" width="1" height="1" fill="${color(x, y)}"/>` : ''))).join('');

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" shape-rendering="crispEdges">
<rect width="14" height="14" rx="3" fill="#05070A"/>
<rect x=".5" y=".5" width="13" height="13" rx="2.6" fill="none" stroke="#3DFFB5" stroke-opacity=".35" stroke-width=".5" shape-rendering="geometricPrecision"/>
${rects(2, 2)}
</svg>`;

await fs.writeFile(path.join(PUB, 'favicon.svg'), favicon);
for (const [file, size] of [['favicon-32.png', 32], ['apple-touch-icon.png', 180], ['icon-192.png', 192], ['icon-512.png', 512]]) {
  await sharp(Buffer.from(favicon), { density: 600 }).resize(size, size, { kernel: 'nearest' }).png().toFile(path.join(PUB, file));
}
console.log('[assets] favicons ✓');

// ---------- OG-Bild ----------
const data = JSON.parse(await fs.readFile(path.join(PUB, 'data/repos.json'), 'utf8'));
const leafBig = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10" width="88" height="88" shape-rendering="crispEdges">${rects(0, 0)}</svg>`;
const fontDir = path.join(ROOT, 'node_modules/@fontsource-variable');
const sora = (await fs.readFile(path.join(fontDir, 'sora/files/sora-latin-wght-normal.woff2'))).toString('base64');
const mono = (await fs.readFile(path.join(fontDir, 'jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2'))).toString('base64');
const rings = [100, 175, 250]
  .map((r, i) => `<circle cx="930" cy="300" r="${r}" fill="none" stroke="rgba(61,255,181,${0.12 + i * 0.05})" ${i === 1 ? 'stroke-dasharray="3 9"' : ''}/>`)
  .join('');
const sats = data.projects
  .slice(0, 12)
  .map((p, i) => {
    const ring = { tool: 100, app: 175, game: 250 }[p.type] ?? 250;
    const a = (i / 12) * Math.PI * 2 + i;
    const x = 930 + Math.cos(a) * ring;
    const y = 315 + Math.sin(a) * ring;
    const c = { tool: '#8B6CFF', app: '#3CD7FF', game: '#3DFFB5' }[p.type];
    return `<circle cx="${x}" cy="${y}" r="5" fill="${c}"/><text x="${x + 12}" y="${y - 8}" font-family="JBM" font-size="15" fill="rgba(228,245,238,.55)">${p.name.toLowerCase()}</text>`;
  })
  .join('');

const html = `<!doctype html><html><head><style>
@font-face{font-family:Sora;src:url(data:font/woff2;base64,${sora}) format('woff2');font-weight:100 800}
@font-face{font-family:JBM;src:url(data:font/woff2;base64,${mono}) format('woff2');font-weight:100 800}
*{margin:0}body{width:1200px;height:630px;background:#05070A;overflow:hidden;position:relative;font-family:Sora;color:#E4F5EE}
.grid{position:absolute;inset:0;background-image:linear-gradient(to right,rgba(61,255,181,.06) 1px,transparent 1px),linear-gradient(to bottom,rgba(61,255,181,.06) 1px,transparent 1px);background-size:60px 60px}
svg.radar{position:absolute;inset:0}
.c{position:absolute;left:72px;bottom:80px}
h1{font-size:136px;font-weight:700;letter-spacing:-.065em;line-height:.9}
p{font-family:JBM;font-size:22px;color:#8AA39A;margin-top:26px}
.top{position:absolute;left:72px;top:64px;display:flex;align-items:center;gap:18px;font-family:JBM;font-size:20px;color:#3DFFB5}
.pill{border:1px solid rgba(61,255,181,.35);border-radius:99px;padding:8px 16px}
.v{position:absolute;inset:0;background:radial-gradient(ellipse 60% 70% at 25% 70%,rgba(5,7,10,.85),transparent 70%)}
</style></head><body><div class="grid"></div>
<svg class="radar" width="1200" height="630">${rings}
<path d="M930 315 L${930 + 250 * Math.cos(-0.6)} ${315 + 250 * Math.sin(-0.6)}" stroke="rgba(61,255,181,.7)"/>${sats}</svg>
<div class="v"></div>
<div class="top">${leafBig.replace('width="88" height="88"', 'width="44" height="44"')}<span class="pill">● ${data.projects.length} Projekte · live auf GitHub</span></div>
<div class="c"><h1>peppigminze</h1><p>Mission Control für Games &amp; Apps</p></div>
</body></html>`;

const { chromium } = await import('playwright');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: path.join(PUB, 'og-image.png') });
await browser.close();
console.log('[assets] og-image ✓');

// ---------- Sitemap ----------
await fs.writeFile(
  path.join(PUB, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://peppigminze.com/</loc><lastmod>${new Date().toISOString().slice(0, 10)}</lastmod><changefreq>daily</changefreq><priority>1.0</priority></url>
</urlset>
`,
);
console.log('[assets] sitemap ✓');

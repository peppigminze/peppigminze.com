#!/usr/bin/env node
/**
 * Automatische Screenshots: Für jedes LIVE-Projekt ohne eigenes Vorschaubild
 * wird die Subdomain mit Playwright (Chromium) fotografiert → public/previews/<repo>.webp
 * Läuft in der GitHub Action nach fetch-repos.mjs. Fehler sind nie fatal.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const JSON_PATH = path.join(ROOT, 'public/data/repos.json');

const data = JSON.parse(await fs.readFile(JSON_PATH, 'utf8'));
const targets = data.projects.filter((p) => p.status === 'live' && p.url && !p.preview);
if (!targets.length) {
  console.log('[shots] nothing to capture');
  process.exit(0);
}

const { chromium } = await import('playwright');
const sharp = (await import('sharp')).default;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1 });

for (const p of targets) {
  try {
    await page.goto(p.url, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(1500); // Intros/Animationen kurz laufen lassen
    const png = await page.screenshot({ type: 'png' });
    const file = `${p.name.toLowerCase()}.webp`;
    await sharp(png).resize({ width: 960 }).webp({ quality: 78 }).toFile(path.join(ROOT, 'public/previews', file));
    p.preview = `/previews/${file}`;
    console.log('[shots] ✓', p.name);
  } catch (e) {
    console.log('[shots] ✗', p.name, e.message.split('\n')[0]);
  }
}
await browser.close();
await fs.writeFile(JSON_PATH, JSON.stringify(data, null, 2));

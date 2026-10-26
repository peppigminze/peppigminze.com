#!/usr/bin/env node
/**
 * Holt alle öffentlichen Repos serverseitig (GitHub Action) und schreibt
 *   public/data/repos.json  +  public/previews/<repo>.webp
 * Token kommt ausschließlich aus der Umgebung (GH_TOKEN) – nie aus dem Code.
 * Ohne Token läuft das Script auch, aber mit 60 Requests/h Limit.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mergeProject, filterRepos, computeStats } from '../shared/merge.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_JSON = path.join(ROOT, 'public/data/repos.json');
const OUT_PREV = path.join(ROOT, 'public/previews');
const config = JSON.parse(await fs.readFile(path.join(ROOT, 'projects.config.json'), 'utf8'));
const USER = config.settings?.user || 'peppigminze';
const TOKEN = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
const SKIP_LIVE = process.env.SKIP_LIVE_CHECK === '1';

const headers = {
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
  'User-Agent': 'peppigminze-hub',
  ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
};

const log = (...a) => console.log('[repos]', ...a);

async function gh(url, opts = {}) {
  const res = await fetch(url.startsWith('http') ? url : `https://api.github.com${url}`, {
    headers: { ...headers, ...(opts.headers || {}) },
  });
  if (!res.ok && !opts.allowFail) throw new Error(`${res.status} ${url}: ${(await res.text()).slice(0, 200)}`);
  return res;
}

async function listRepos() {
  const all = [];
  for (let page = 1; page < 10; page++) {
    const res = await gh(`/users/${USER}/repos?per_page=100&page=${page}&sort=pushed&type=owner`);
    const batch = await res.json();
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

/** Commit-Anzahl über den Link-Header (per_page=1 → letzte Seite = Anzahl). */
async function commitCount(repo) {
  const res = await gh(`/repos/${USER}/${repo.name}/commits?per_page=1&sha=${repo.default_branch}`, { allowFail: true });
  if (!res.ok) return 0; // leeres Repo → 409
  const link = res.headers.get('link') || '';
  const m = link.match(/[?&]page=(\d+)>; rel="last"/);
  if (m) return Number(m[1]);
  const arr = await res.json();
  return Array.isArray(arr) ? arr.length : 0;
}

async function languages(repo) {
  const res = await gh(`/repos/${USER}/${repo.name}/languages`, { allowFail: true });
  return res.ok ? res.json() : {};
}

/** README → kurzer Klartext-Auszug (ohne Markdown, Bilder, Code). */
async function readmeExcerpt(repo) {
  const res = await gh(`/repos/${USER}/${repo.name}/readme`, {
    allowFail: true,
    headers: { Accept: 'application/vnd.github.raw' },
  });
  if (!res.ok) return null;
  const md = await res.text();
  const text = md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+.*$/gm, '\n')
    .replace(/^\s*[-*+]\s+/gm, '• ')
    .replace(/[*_`>|]/g, '')
    .replace(/\n{2,}/g, '\n\n')
    .trim();
  const paras = text.split(/\n\n+/).map((p) => p.replace(/\s+/g, ' ').trim()).filter((p) => p.length > 20);
  let out = '';
  for (const p of paras) {
    if ((out + p).length > 650) break;
    out += (out ? '\n\n' : '') + p;
  }
  return out || paras[0]?.slice(0, 650) || null;
}

const PREVIEW_PATTERNS = [
  /^preview\.(png|jpe?g|webp|gif)$/i,
  /^assets\/cover\.(png|jpe?g|webp|gif)$/i,
  /^cover\.(png|jpe?g|webp)$/i,
  /(^|\/)og-image\.(png|jpe?g|webp)$/i,
  /(^|\/)og\.(png|jpe?g|webp)$/i,
  /^(public|assets|img|images|docs)\/(preview|cover|screenshot)\.(png|jpe?g|webp)$/i,
  /^screenshot\.(png|jpe?g|webp)$/i,
];

/** Sucht ein Vorschaubild im Repo (Priorität nach Reihenfolge der Patterns). */
async function repoPreview(repo) {
  const res = await gh(`/repos/${USER}/${repo.name}/git/trees/${repo.default_branch}?recursive=1`, { allowFail: true });
  if (!res.ok) return null;
  const { tree = [] } = await res.json();
  const files = tree.filter((t) => t.type === 'blob' && t.size < 8_000_000).map((t) => t.path);
  for (const re of PREVIEW_PATTERNS) {
    const hit = files.find((f) => re.test(f));
    if (hit) return `https://raw.githubusercontent.com/${USER}/${repo.name}/${repo.default_branch}/${hit}`;
  }
  return null;
}

/** Bild laden → WebP (max. 960px breit) in public/previews ablegen. */
async function saveWebp(srcUrl, name) {
  try {
    const { default: sharp } = await import('sharp');
    const res = await fetch(srcUrl);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const file = `${name.toLowerCase()}.webp`;
    await sharp(buf).resize({ width: 960, height: 600, fit: 'cover', position: 'top' }).webp({ quality: 78 }).toFile(path.join(OUT_PREV, file));
    return `/previews/${file}`;
  } catch (e) {
    log('preview failed', name, e.message);
    return null;
  }
}

/** Live-Check der Subdomain: antwortet sie mit < 400 → LIVE. */
async function liveCheck(url) {
  if (!url || SKIP_LIVE) return false;
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, { method, redirect: 'follow', signal: AbortSignal.timeout(8000) });
      if (res.status < 400) return true;
      if (method === 'GET') return false;
    } catch {
      /* DNS/Timeout → nicht live */
    }
  }
  return false;
}

async function main() {
  await fs.mkdir(OUT_PREV, { recursive: true });
  log(`user=${USER} token=${TOKEN ? 'yes' : 'no (60 req/h limit)'}`);

  let raw;
  try {
    raw = await listRepos();
  } catch (e) {
    // API nicht erreichbar → bestehende Daten behalten, Build nicht brechen.
    log('⚠ could not list repos:', e.message, '→ keeping existing repos.json');
    return;
  }

  const repos = filterRepos(raw, config);
  log(`${raw.length} repos, ${repos.length} after filter`);

  const projects = [];
  for (const repo of repos) {
    const [langs, commits, readme, previewSrc] = await Promise.all([
      languages(repo),
      commitCount(repo),
      readmeExcerpt(repo),
      config.projects?.[repo.name]?.preview ? null : repoPreview(repo),
    ]);
    const base = mergeProject(repo, config);
    // Live-URL suchen: Subdomain zuerst, dann Homepage-Feld, dann GitHub Pages (github.io)
    const candidates = [
      base.url,
      repo.homepage || null,
      repo.has_pages ? `https://${USER.toLowerCase()}.github.io/${repo.name}/` : null,
    ].filter((u, i, a) => u && a.indexOf(u) === i);
    let liveUrl = null;
    if (config.projects?.[repo.name]?.subdomain !== false || repo.has_pages) {
      for (const u of candidates) {
        if (await liveCheck(u)) {
          liveUrl = u;
          break;
        }
      }
    }
    const preview = previewSrc ? await saveWebp(previewSrc, repo.name) : null;
    const p = mergeProject(repo, config, {
      languages: langs,
      commits,
      readme,
      preview,
      url: liveUrl || undefined,
      status: repo.archived ? 'archived' : liveUrl ? 'live' : 'building',
    });
    log(`${p.name.padEnd(24)} ${p.status.padEnd(9)} commits=${String(commits).padEnd(4)} ${p.url ?? '-'} preview=${p.preview ? 'repo' : 'none'}`);
    projects.push(p);
  }

  const data = {
    generatedAt: new Date().toISOString(),
    source: 'build',
    user: USER,
    stats: computeStats(projects),
    projects,
  };
  await fs.writeFile(OUT_JSON, JSON.stringify(data, null, 2));
  log(`wrote ${path.relative(ROOT, OUT_JSON)} (${projects.length} projects)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

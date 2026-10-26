/**
 * Gemeinsame Logik für Build-Script (Node) UND Client-Fallback (Browser).
 * Wandelt rohe GitHub-API-Repos + projects.config.json in Projekt-Objekte um.
 * Bewusst plain JS ohne Abhängigkeiten, damit es in beiden Welten läuft.
 */

/** Repo-Name → gültiges Subdomain-Label ("Economy_peppigminze" → "economy-peppigminze"). */
export function toSubdomain(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 63);
}

/** Erster sinnvoller Satz/Absatz aus dem README als Ersatz-Beschreibung (max. ~170 Zeichen). */
export function summarizeReadme(readme) {
  if (!readme) return '';
  const para = String(readme)
    .split(/\n\n+/)
    .map((p) => p.split(' • ')[0].trim()) // Aufzählungen abschneiden
    .find((p) => p.length > 30 && !/https?:\/\//.test(p) && !/^•/.test(p) && !/^(index\.html|npm |node )/.test(p));
  if (!para) return '';
  if (para.length <= 170) return para;
  // letztes echtes Satzende vor Zeichen 170 (kein "vs." / "z.B.")
  let end = -1;
  const re = /[.!?](?=\s+[A-ZÄÖÜ])/g;
  let m;
  while ((m = re.exec(para)) && m.index < 170) {
    const word = para.slice(0, m.index).split(/\s/).pop() || '';
    if (word.length > 3) end = m.index;
  }
  return end > 50 ? para.slice(0, end + 1) : para.slice(0, 170).replace(/\s+\S*$/, '') + ' …';
}

/** Typ ermitteln: Config > GitHub-Topics > "app". */
export function guessType(repo, override) {
  if (override && override.type) return override.type;
  const topics = repo.topics || [];
  if (topics.some((t) => /^(game|games|spiel|gamedev|roblox|browser-game)$/.test(t))) return 'game';
  if (topics.some((t) => /^(tool|cli|bot|discord-bot|automation|script)$/.test(t))) return 'tool';
  return 'app';
}

/**
 * @param {any} repo  Roh-Objekt aus GET /users/:user/repos
 * @param {any} config  projects.config.json
 * @param {Record<string, any>} [extra]  Felder aus dem Build (status, preview, readme, commits, languages)
 */
export function mergeProject(repo, config, extra = {}) {
  const o = (config.projects && config.projects[repo.name]) || {};
  const domain = config.settings?.domain || 'peppigminze.com';
  const sub = o.subdomain === false ? null : o.subdomain || toSubdomain(repo.name);
  // URL-Priorität: Config > im Build ermittelte Live-URL > Subdomain-Schema
  const url = o.url || extra.url || (sub ? `https://${sub}.${domain}` : null);
  const ghDesc = repo.description || summarizeReadme(extra.readme) || '';
  const description =
    typeof o.description === 'string'
      ? { de: o.description, en: o.description }
      : o.description
        ? { de: o.description.de || ghDesc, en: o.description.en || o.description.de || ghDesc }
        : { de: ghDesc, en: ghDesc };

  let status = o.status || extra.status || null;
  if (!status) status = repo.archived ? 'archived' : 'building';
  if (repo.archived && !o.status) status = 'archived';

  return {
    name: repo.name,
    title: o.title || repo.name,
    description,
    type: guessType(repo, o),
    url,
    repoUrl: repo.html_url || `https://github.com/${config.settings?.user}/${repo.name}`,
    language: repo.language || null,
    languages: extra.languages || (repo.language ? { [repo.language]: 1 } : {}),
    topics: repo.topics || [],
    stars: repo.stargazers_count || 0,
    forks: repo.forks_count || 0,
    updatedAt: repo.pushed_at || repo.updated_at || null,
    createdAt: repo.created_at || null,
    archived: !!repo.archived,
    status,
    featured: !!o.featured,
    order: typeof o.order === 'number' ? o.order : 999,
    preview: o.preview || extra.preview || null,
    readme: extra.readme || null,
    commits: extra.commits ?? null,
  };
}

/** Filtert Forks, ausgeschlossene und versteckte Repos. */
export function filterRepos(repos, config) {
  const s = config.settings || {};
  const exclude = new Set((s.exclude || []).map((x) => x.toLowerCase()));
  return repos.filter((r) => {
    if (s.excludeForks !== false && r.fork) return false;
    if (exclude.has(String(r.name).toLowerCase())) return false;
    if (config.projects?.[r.name]?.hidden) return false;
    if (r.private) return false;
    return true;
  });
}

/** Aggregierte Kennzahlen für die Stats-Leiste. */
export function computeStats(projects) {
  const langs = new Set();
  let commits = 0;
  let stars = 0;
  for (const p of projects) {
    Object.keys(p.languages || {}).forEach((l) => langs.add(l));
    if (p.language) langs.add(p.language);
    commits += p.commits || 0;
    stars += p.stars || 0;
  }
  return { repos: projects.length, commits, stars, languages: langs.size };
}

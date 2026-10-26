import config from '../../projects.config.json';
import { computeStats, filterRepos, mergeProject } from '../../shared/merge.js';
import type { RepoData } from '../types';

/**
 * Lädt die Projektdaten.
 * 1. /data/repos.json (im Build von der GitHub Action erzeugt, enthält Live-Status, Previews, README)
 * 2. Fallback: öffentliche GitHub-API ohne Token (60 Requests/h pro Besucher-IP, reicht dafür locker)
 */
export async function loadRepoData(): Promise<RepoData> {
  try {
    const res = await fetch('/data/repos.json', { cache: 'no-cache' });
    if (res.ok) {
      const data = (await res.json()) as RepoData;
      if (data.projects?.length) return data;
    }
  } catch {
    /* weiter zum Fallback */
  }
  return loadFromPublicApi();
}

export async function loadFromPublicApi(): Promise<RepoData> {
  const user = config.settings.user;
  const res = await fetch(`https://api.github.com/users/${user}/repos?per_page=100&sort=pushed`, {
    headers: { Accept: 'application/vnd.github+json' },
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status}`);
  const raw = await res.json();
  // Ohne Build kein Live-Check: Repos mit GitHub Pages gelten als live und verlinken dorthin.
  const projects = filterRepos(raw, config).map((r) =>
    mergeProject(r, config, r.has_pages ? { url: r.homepage || `https://${user.toLowerCase()}.github.io/${r.name}/`, status: 'live' } : {}),
  );
  return { generatedAt: new Date().toISOString(), source: 'api', user, stats: computeStats(projects), projects };
}

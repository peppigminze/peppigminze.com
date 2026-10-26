import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { gsap, ScrollTrigger } from '../lib/scroll';
import { prefersReducedMotion } from '../lib/motion';
import type { Project, ProjectType, RepoData } from '../types';
import ProjectCard from './ProjectCard';
import { SearchIcon } from './Icons';

type Filter = 'all' | ProjectType;
type Sort = 'recent' | 'stars' | 'az';

/** Segmented Control mit gleitendem "Thumb". */
function Segmented({ value, onChange, counts }: { value: Filter; onChange: (f: Filter) => void; counts: Record<Filter, number> }) {
  const { t } = useI18n();
  const wrap = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ left: 4, width: 0 });
  const opts: Filter[] = ['all', 'game', 'app', 'tool'];

  useLayoutEffect(() => {
    const measure = () => {
      const btn = wrap.current?.querySelector<HTMLButtonElement>(`[data-v="${value}"]`);
      if (btn) setThumb({ left: btn.offsetLeft, width: btn.offsetWidth });
    };
    measure();
    document.fonts?.ready.then(measure);
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [value, t]);

  return (
    <div ref={wrap} className="segmented" role="group" aria-label={t('filter.label')}>
      <span className="thumb" style={{ left: thumb.left, width: thumb.width }} aria-hidden="true" />
      {opts.map((o) => (
        <button key={o} type="button" data-v={o} aria-pressed={value === o} onClick={() => onChange(o)}>
          {t(`filter.${o}` as const)}
          <span className="count">{counts[o]}</span>
        </button>
      ))}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-[360px] animate-pulse rounded-2xl border border-[var(--line)] bg-[rgba(14,24,26,.5)]" />
      ))}
    </div>
  );
}

export default function Projects({ data, error, onOpen }: { data: RepoData | null; error: boolean; onOpen: (p: Project) => void }) {
  const { t, lang } = useI18n();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('recent');
  const gridRef = useRef<HTMLDivElement>(null);
  const headRef = useRef<HTMLDivElement>(null);

  const all = data?.projects ?? [];
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: all.length, game: 0, app: 0, tool: 0 };
    all.forEach((p) => c[p.type]++);
    return c;
  }, [all]);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    let l = all.filter((p) => filter === 'all' || p.type === filter);
    if (q) {
      l = l.filter((p) =>
        [p.title, p.name, p.description.de, p.description.en, p.language ?? '', ...p.topics].join(' ').toLowerCase().includes(q),
      );
    }
    const byDate = (a: Project, b: Project) => +new Date(b.updatedAt ?? 0) - +new Date(a.updatedAt ?? 0);
    const cmp: Record<Sort, (a: Project, b: Project) => number> = {
      recent: byDate,
      stars: (a, b) => b.stars - a.stars || byDate(a, b),
      az: (a, b) => a.title.localeCompare(b.title, lang),
    };
    return [...l].sort(cmp[sort]);
  }, [all, filter, query, sort, lang]);

  // Featured nur in der Standardansicht als Bento oben; sonst alle im normalen Grid
  const bentoMode = filter === 'all' && !query && sort === 'recent';
  const featured = bentoMode ? list.filter((p) => p.featured).sort((a, b) => a.order - b.order).slice(0, 3) : [];
  const rest = bentoMode ? list.filter((p) => !featured.includes(p)) : list;

  // Überschrift: Zeilen-Reveal beim Scrollen
  useEffect(() => {
    if (prefersReducedMotion() || !headRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.sec-in',
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, scrollTrigger: { trigger: headRef.current, start: 'top 82%', once: true } },
      );
    }, headRef);
    return () => ctx.revert();
  }, []);

  // Karten: Scroll-Reveal mit Stagger (Batch) – neu bei jeder Filteränderung
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const cards = Array.from(grid.querySelectorAll<HTMLElement>('.card'));
    if (prefersReducedMotion()) {
      gsap.set(cards, { opacity: 1 });
      return;
    }
    gsap.set(cards, { opacity: 0, y: 40 });
    const triggers = ScrollTrigger.batch(cards, {
      start: 'top 92%',
      once: true,
      onEnter: (els) =>
        gsap.to(els, { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.08, overwrite: true, clearProps: 'y' }),
    });
    ScrollTrigger.refresh();
    return () => triggers.forEach((tr) => tr.kill());
  }, [list, bentoMode]);

  const reset = () => {
    setFilter('all');
    setQuery('');
    setSort('recent');
  };

  return (
    <section id="projekte" className="relative z-10 mx-auto max-w-[1400px] px-5 pb-28 pt-24 sm:px-8 md:pt-32" aria-labelledby="projects-title">
      <div ref={headRef} className="mb-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 id="projects-title" className="h-section sec-in">
            {t('projects.title')}
          </h2>
          <p className="lead sec-in mt-4">{t('projects.lead')}</p>
        </div>

        <div className="sec-in flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="-mx-1 overflow-x-auto px-1 pb-1 sm:pb-0">
            <Segmented value={filter} onChange={setFilter} counts={counts} />
          </div>
          <div className="flex gap-3">
            <label className="field flex flex-1 items-center gap-2 px-3 sm:w-[220px] sm:flex-none">
              <span className="text-mint" aria-hidden="true">
                <SearchIcon />
              </span>
              <span className="sr-only">{t('search.label')}</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('search.placeholder')}
                className="h-full w-full min-w-0 placeholder:text-ink-faint"
              />
            </label>
            <label className="field flex items-center px-3">
              <span className="sr-only">{t('sort.label')}</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-full pr-1">
                <option value="recent">{t('sort.recent')}</option>
                <option value="stars">{t('sort.stars')}</option>
                <option value="az">{t('sort.az')}</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {data ? `${list.length} / ${all.length}` : ''}
      </p>

      {!data && !error && <SkeletonGrid />}
      {error && (
        <div className="glass hud rounded-2xl p-8">
          <p className="mono text-ink">{t('data.error')}</p>
        </div>
      )}

      {data && list.length === 0 && (
        <div className="glass hud flex flex-col items-start gap-4 rounded-2xl p-8">
          <p className="text-lg text-ink">{t('empty.title')}</p>
          <button type="button" className="btn btn-ghost" onClick={reset}>
            {t('empty.action')}
          </button>
        </div>
      )}

      <div ref={gridRef}>
        {featured.length > 0 && (
          <div className={`bento mb-4 grid gap-4 ${featured.length === 1 ? 'bento-1' : featured.length === 2 ? 'bento-2' : 'bento-3'}`}>
            {featured.map((p, i) => (
              <div key={p.name} className={`bento-item bento-${i}`}>
                <ProjectCard project={p} featured onOpen={onOpen} />
              </div>
            ))}
          </div>
        )}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((p) => (
            <ProjectCard key={p.name} project={p} onOpen={onOpen} />
          ))}
        </div>
      </div>

      {data?.source === 'api' && <p className="label mt-6">{t('data.fallback')}</p>}
    </section>
  );
}

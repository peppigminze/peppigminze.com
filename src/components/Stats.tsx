import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n';
import { gsap } from '../lib/scroll';
import { prefersReducedMotion } from '../lib/motion';
import { relativeTime } from '../lib/time';
import type { RepoData } from '../types';
import { SyncIcon } from './Icons';

/** Live-Stats: Zahlen zählen hoch, sobald die Leiste ins Bild kommt. */
export default function Stats({ data }: { data: RepoData | null }) {
  const { t, lang } = useI18n();
  const root = useRef<HTMLElement>(null);

  const items = [
    { key: 'stats.repos', value: data?.stats.repos ?? 0 },
    { key: 'stats.commits', value: data?.stats.commits ?? 0 },
    { key: 'stats.stars', value: data?.stats.stars ?? 0 },
    { key: 'stats.languages', value: data?.stats.languages ?? 0 },
  ] as const;

  useEffect(() => {
    if (!data || !root.current) return;
    const nums = Array.from(root.current.querySelectorAll<HTMLElement>('[data-count]'));
    if (prefersReducedMotion()) {
      nums.forEach((n) => (n.textContent = Number(n.dataset.count).toLocaleString('de-CH')));
      return;
    }
    const ctx = gsap.context(() => {
      nums.forEach((n, i) => {
        const o = { v: 0 };
        const target = Number(n.dataset.count);
        gsap.to(o, {
          v: target,
          duration: 1.6 + i * 0.15,
          ease: 'expo.out',
          scrollTrigger: { trigger: root.current, start: 'top 85%', once: true },
          onUpdate: () => (n.textContent = Math.round(o.v).toLocaleString('de-CH')),
        });
      });
      gsap.fromTo(
        root.current!.querySelectorAll('.stat-cell'),
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.7, stagger: 0.07, ease: 'power3.out', scrollTrigger: { trigger: root.current, start: 'top 88%', once: true } },
      );
    }, root);
    return () => ctx.revert();
  }, [data]);

  return (
    <section ref={root} aria-label="Statistiken" className="relative z-10 border-y border-[var(--line)] bg-[rgba(5,7,10,.6)] backdrop-blur-md">
      <div className="mx-auto grid max-w-[1400px] grid-cols-2 md:grid-cols-[repeat(4,1fr)_auto]">
        {items.map((it, i) => (
          <div
            key={it.key}
            className={`stat-cell relative px-5 py-7 sm:px-8 md:py-9 ${i % 2 === 1 ? 'border-l' : ''} ${i > 1 ? 'border-t md:border-t-0' : ''} ${
              i > 0 ? 'md:border-l' : ''
            } border-[var(--line)]`}
          >
            <div className="font-display text-[clamp(2.2rem,1.6rem+2.4vw,3.6rem)] font-semibold leading-none tracking-[-0.04em] tabular-nums text-ink">
              <span data-count={it.value}>{data ? '0' : '––'}</span>
            </div>
            <div className="label mt-3">{t(it.key)}</div>
          </div>
        ))}
        <div className="stat-cell col-span-2 flex items-center gap-2 border-t border-[var(--line)] px-5 py-4 sm:px-8 md:col-span-1 md:flex-col md:items-start md:justify-center md:border-l md:border-t-0 md:py-0">
          <span className="label flex items-center gap-1.5 text-mint">
            <SyncIcon /> {t('stats.synced')}
          </span>
          <span className="mono text-[12px] text-ink-muted">{data ? relativeTime(data.generatedAt, lang) : '…'}</span>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n';
import { gsap } from '../lib/scroll';
import { prefersReducedMotion } from '../lib/motion';
import { langColor } from '../lib/langColors';
import { relativeTime } from '../lib/time';
import type { RepoData } from '../types';

/** "Über mich" als Terminal-Session. Stack und letztes Projekt kommen live aus den Repo-Daten. */
export default function About({ data }: { data: RepoData | null }) {
  const { t, lang } = useI18n();
  const root = useRef<HTMLElement>(null);

  const languages = (() => {
    const m = new Map<string, number>();
    data?.projects.forEach((p) => Object.entries(p.languages).forEach(([l, b]) => m.set(l, (m.get(l) ?? 0) + b)));
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([l]) => l).slice(0, 8);
  })();
  const latest = data ? [...data.projects].sort((a, b) => +new Date(b.updatedAt ?? 0) - +new Date(a.updatedAt ?? 0))[0] : null;

  useEffect(() => {
    if (prefersReducedMotion() || !root.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.about-in', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'power3.out', scrollTrigger: { trigger: root.current, start: 'top 75%', once: true } });
      gsap.fromTo('.term-line', { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.4, stagger: 0.09, ease: 'power2.out', scrollTrigger: { trigger: '.term', start: 'top 80%', once: true } });
    }, root);
    return () => ctx.revert();
  }, []);

  const Prompt = ({ cmd }: { cmd: string }) => (
    <div className="term-line">
      <span className="text-mint">peppigminze@hub</span>
      <span className="text-ink-faint">:~$ </span>
      <span className="text-ink">{cmd}</span>
    </div>
  );

  return (
    <section ref={root} id="about" className="relative z-10 mx-auto max-w-[1400px] px-5 py-24 sm:px-8 md:py-32" aria-labelledby="about-title">
      <div className="grid gap-12 lg:grid-cols-[5fr_7fr] lg:gap-16">
        <div>
          <h2 id="about-title" className="h-section about-in">
            {t('about.title')}
          </h2>
          <p className="about-in mt-6 max-w-[30ch] text-[1.35rem] leading-snug text-ink">{t('about.lead')}</p>
        </div>

        <div className="term about-in glass hud overflow-hidden rounded-2xl">
          <div className="mono flex items-center justify-between border-b border-[var(--line)] px-5 py-3 text-[11.5px] text-ink-faint">
            <span>~/about.txt</span>
            <span className="tabular-nums">zsh · 80×24</span>
          </div>
          <div className="mono space-y-2 p-5 text-[13px] leading-relaxed sm:p-7 sm:text-[13.5px]">
            <Prompt cmd="whoami" />
            <p className="term-line text-ink-muted">{t('about.p1')}</p>
            <Prompt cmd="cat mission.txt" />
            <p className="term-line max-w-[62ch] text-ink-muted">{t('about.p2')}</p>
            <p className="term-line text-ink-muted">{t('about.p3')}</p>
            <Prompt cmd="ls ~/stack" />
            <div className="term-line flex flex-wrap gap-x-5 gap-y-1">
              {(languages.length ? languages : ['…']).map((l) => (
                <span key={l} className="inline-flex items-center gap-1.5 text-ink">
                  <span className="h-2 w-2 rounded-full" style={{ background: langColor(l) }} aria-hidden="true" />
                  {l}
                </span>
              ))}
            </div>
            <Prompt cmd="git log -1 --all" />
            <p className="term-line text-ink-muted">
              {latest ? (
                <>
                  {t('about.latest')}: <span className="text-mint">{latest.title}</span>, {relativeTime(latest.updatedAt, lang)}
                </>
              ) : (
                '…'
              )}
            </p>
            <div className="term-line pt-1">
              <span className="text-mint">peppigminze@hub</span>
              <span className="text-ink-faint">:~$ </span>
              <span className="type-caret" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

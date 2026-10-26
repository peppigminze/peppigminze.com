import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n';
import { gsap, scrollToTarget } from '../lib/scroll';
import { prefersReducedMotion } from '../lib/motion';
import { SITE } from '../site';
import type { RepoData } from '../types';
import HeroCanvas from './HeroCanvas';
import DecodeText from './DecodeText';
import Typewriter from './Typewriter';
import { GitHubIcon } from './Icons';

export default function Hero({ data, started }: { data: RepoData | null; started: boolean }) {
  const { t } = useI18n();
  const root = useRef<HTMLElement>(null);
  const projects = data?.projects ?? [];
  const live = projects.filter((p) => p.status === 'live').length;

  // Einmalige, orchestrierte Eingangssequenz nach dem Boot-Intro
  useEffect(() => {
    if (!started || !root.current) return;
    const items = root.current.querySelectorAll('.hero-in');
    if (prefersReducedMotion()) {
      gsap.set(items, { opacity: 1, y: 0 });
      return;
    }
    const tl = gsap.timeline({ delay: 0.15 });
    tl.fromTo(root.current.querySelector('.hero-canvas'), { opacity: 0, scale: 1.04 }, { opacity: 1, scale: 1, duration: 1.6, ease: 'power2.out' }, 0);
    tl.fromTo(items, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', stagger: 0.09 }, 0.9);
    return () => {
      tl.kill();
    };
  }, [started]);

  // Leichter Parallax beim Scrollen: Titel wandert langsamer als die Seite
  useEffect(() => {
    if (prefersReducedMotion() || !root.current) return;
    const tw = gsap.to(root.current.querySelector('.hero-content'), {
      yPercent: 18,
      opacity: 0.2,
      ease: 'none',
      scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
    });
    return () => {
      tw.scrollTrigger?.kill();
      tw.kill();
    };
  }, []);

  return (
    <section ref={root} id="top" className="relative flex min-h-[100svh] flex-col overflow-hidden" aria-labelledby="hero-title">
      <div className="hero-canvas absolute inset-0" style={{ opacity: started ? undefined : 0 }}>
        <HeroCanvas projects={projects} />
        {/* Vignette, damit Text immer lesbar bleibt */}
        <div
          className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 20% 60%, rgba(5,7,10,.75), transparent 70%), linear-gradient(180deg, transparent 70%, #05070A)' }}
        />
      </div>

      <div className="hero-content relative mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-end px-5 pb-28 pt-28 sm:px-8 md:justify-center md:pb-24">
        <div className="hero-in mono mb-6 flex flex-wrap items-center gap-2 text-[12px] text-ink-muted opacity-0">
          <span className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[rgba(10,18,20,.6)] px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-mint shadow-[0_0_8px_#3DFFB5]" style={{ animation: 'pulse 1.6s infinite' }} />
            {t('hero.online')}
          </span>
          {data && (
            <span className="rounded-full border border-[var(--line)] bg-[rgba(10,18,20,.6)] px-3 py-1.5 tabular-nums">
              {projects.length} {t('hero.tracking')}
              {live > 0 && <span className="text-mint">, {live} {t('hero.live')}</span>}
            </span>
          )}
        </div>

        <h1 id="hero-title" className="hero-title font-display">
          <DecodeText text="peppigminze" start={started} />
        </h1>

        <p className="mt-6 min-h-[3.2em] max-w-[34ch] text-[1.15rem] leading-snug text-ink sm:text-[1.35rem]">
          <Typewriter text={t('hero.sub')} start={started} delay={900} />
        </p>

        <div className="hero-in mt-8 flex flex-wrap items-center gap-3 opacity-0">
          <a
            href="#projekte"
            className="btn btn-primary"
            onClick={(e) => {
              e.preventDefault();
              scrollToTarget('#projekte');
            }}
          >
            {t('hero.cta')} <span className="arrow" aria-hidden="true">↓</span>
          </a>
          <a href={SITE.github} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
            <GitHubIcon className="h-4 w-4" /> {t('hero.github')}
          </a>
        </div>
      </div>

      {/* Telemetrie-Leiste unten: Radar-Legende + Scroll-Hinweis */}
      <div className="hero-in absolute inset-x-0 bottom-0 opacity-0">
        <div className="mx-auto flex max-w-[1400px] items-end justify-between px-5 pb-6 sm:px-8">
          <ul className="mono flex gap-4 text-[11px] text-ink-muted" aria-label={t('hero.legend')}>
            <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-mint" />{t('filter.game')}</li>
            <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-cyan-hud" />{t('filter.app')}</li>
            <li className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-violet-hud" />{t('filter.tool')}</li>
          </ul>
          <span className="mono hidden items-center gap-2 text-[11px] text-ink-faint sm:flex" aria-hidden="true">
            {t('hero.scroll')}
            <span className="relative block h-8 w-px overflow-hidden bg-[var(--line)]">
              <span className="absolute inset-x-0 top-0 h-3 bg-mint" style={{ animation: 'scrollhint 1.8s var(--ease-out) infinite' }} />
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}

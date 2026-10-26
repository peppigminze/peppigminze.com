import { useEffect, useRef } from 'react';
import { useI18n } from '../i18n';
import { gsap, lockScroll } from '../lib/scroll';
import { prefersReducedMotion } from '../lib/motion';
import { formatDate, relativeTime } from '../lib/time';
import { langColor } from '../lib/langColors';
import { projectHue } from '../lib/hash';
import type { Project } from '../types';
import { Preview, StatusBadge } from './ProjectCard';
import { CloseIcon, ExternalIcon, GitHubIcon } from './Icons';

/** Detailansicht: große Preview, README-Auszug, Tech-Stack, Fakten, Links. Fokusfalle + Esc. */
export default function ProjectModal({ project: p, onClose }: { project: Project; onClose: () => void }) {
  const { t, lang } = useI18n();
  const panel = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const closing = useRef(false);

  const close = () => {
    if (closing.current) return;
    closing.current = true;
    if (prefersReducedMotion()) return onClose();
    gsap.to(panel.current, { opacity: 0, y: 24, scale: 0.98, duration: 0.25, ease: 'power2.in' });
    gsap.to(backdrop.current, { opacity: 0, duration: 0.25, onComplete: onClose });
  };

  useEffect(() => {
    const prevFocus = document.activeElement as HTMLElement | null;
    lockScroll(true);
    closeBtn.current?.focus({ preventScroll: true });
    if (!prefersReducedMotion()) {
      gsap.fromTo(backdrop.current, { opacity: 0 }, { opacity: 1, duration: 0.3 });
      gsap.fromTo(
        panel.current,
        { opacity: 0, y: 40, scale: 0.97, clipPath: 'inset(8% 4% 8% 4% round 20px)' },
        { opacity: 1, y: 0, scale: 1, clipPath: 'inset(0% 0% 0% 0% round 20px)', duration: 0.6, ease: 'expo.out' },
      );
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'Tab' && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])');
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      lockScroll(false);
      prevFocus?.focus?.({ preventScroll: true });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const total = Object.values(p.languages).reduce((a, b) => a + b, 0) || 1;
  const langs = Object.entries(p.languages)
    .sort((a, b) => b[1] - a[1])
    .map(([name, bytes]) => ({ name, pct: (bytes / total) * 100 }));
  const isGame = p.type === 'game';

  return (
    <>
      <div ref={backdrop} className="modal-backdrop" onClick={close} aria-hidden="true" />
      <div
        ref={panel}
        className="modal-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        style={{ ['--hue' as string]: projectHue(p.name) }}
        data-lenis-prevent
      >
        <div className="modal-scroll">
          <div className="relative aspect-[16/8] w-full overflow-hidden bg-[#071012] [&>canvas]:absolute [&>canvas]:inset-0 [&>canvas]:h-full [&>canvas]:w-full [&>img]:absolute [&>img]:inset-0 [&>img]:h-full [&>img]:w-full [&>img]:object-cover">
            <Preview project={p} active eager />
            <div className="pointer-events-none absolute inset-0" style={{ background: 'linear-gradient(180deg, transparent 50%, rgba(8,13,15,.95))' }} />
            <div className="absolute left-4 top-4 flex gap-2">
              <StatusBadge status={p.status} />
              <span className="tag !bg-[rgba(5,7,10,.7)]">{t(`type.${p.type}` as const)}</span>
            </div>
          </div>

          <div className="grid gap-10 p-6 sm:p-10 md:grid-cols-[1fr_280px]">
            <div className="min-w-0">
              <h2 id="modal-title" className="font-display text-[clamp(2rem,1.4rem+2.6vw,3.4rem)] font-semibold leading-none tracking-[-0.04em]">
                {p.title}
              </h2>
              <p className="mt-4 max-w-[60ch] text-[1.05rem] text-ink">{p.description[lang] || t('card.noDesc')}</p>

              <div className="mt-6 flex flex-wrap gap-3">
                {p.url && (
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="play-pill !h-11 !px-5 !text-[13px]">
                    <span className="tri" aria-hidden="true" />
                    {(isGame ? t('card.play') : t('card.open')).toUpperCase()}
                    <span className="arr" aria-hidden="true">
                      <span>→</span>
                    </span>
                  </a>
                )}
                <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                  <GitHubIcon /> GitHub <ExternalIcon />
                </a>
              </div>
              {p.url && <p className="mono mt-3 text-[12px] text-ink-faint">{p.url.replace('https://', '')}</p>}

              <h3 className="label mt-10 text-mint">{t('modal.readme')}</h3>
              <div className="mono mt-3 whitespace-pre-line rounded-xl border border-[var(--line)] bg-[rgba(5,7,10,.5)] p-5 text-[13px] leading-relaxed text-ink-muted">
                {p.readme || t('modal.noReadme')}
              </div>
            </div>

            <aside className="flex flex-col gap-8">
              <div>
                <h3 className="label text-mint">{t('modal.stack')}</h3>
                {langs.length > 0 ? (
                  <>
                    <div className="lang-bar mt-3" aria-hidden="true">
                      {langs.map((l) => (
                        <span key={l.name} style={{ width: `${l.pct}%`, background: langColor(l.name) }} />
                      ))}
                    </div>
                    <ul className="mt-3 space-y-1.5">
                      {langs.slice(0, 6).map((l) => (
                        <li key={l.name} className="mono flex items-center justify-between text-[12px]">
                          <span className="flex items-center gap-2 text-ink">
                            <span className="h-2 w-2 rounded-full" style={{ background: langColor(l.name) }} />
                            {l.name}
                          </span>
                          <span className="tabular-nums text-ink-faint">{l.pct.toFixed(1)}%</span>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <p className="mono mt-3 text-[12px] text-ink-faint">–</p>
                )}
                {p.topics.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {p.topics.map((tg) => (
                      <span key={tg} className="tag">#{tg}</span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="label text-mint">{t('modal.facts')}</h3>
                <dl className="mono mt-3 divide-y divide-[var(--line)] text-[12px]">
                  {[
                    [t('modal.updated'), relativeTime(p.updatedAt, lang)],
                    [t('modal.created'), formatDate(p.createdAt, lang)],
                    [t('modal.commits'), p.commits ?? '–'],
                    [t('modal.stars'), p.stars],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="flex justify-between py-2">
                      <dt className="text-ink-faint">{k}</dt>
                      <dd className="tabular-nums text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </aside>
          </div>
        </div>

        <button
          ref={closeBtn}
          type="button"
          onClick={close}
          className="icon-btn absolute right-4 top-4 z-10 !bg-[rgba(5,7,10,.75)] backdrop-blur"
          aria-label={t('modal.close')}
        >
          <CloseIcon />
        </button>
      </div>
    </>
  );
}

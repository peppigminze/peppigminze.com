import { memo, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { projectHue } from '../lib/hash';
import { langColor } from '../lib/langColors';
import { clamp, isTouch, prefersReducedMotion } from '../lib/motion';
import { relativeTime } from '../lib/time';
import type { Project } from '../types';
import GenerativePreview from './GenerativePreview';
import { GitHubIcon, StarIcon } from './Icons';

export function StatusBadge({ status }: { status: Project['status'] }) {
  const { t } = useI18n();
  return (
    <span className={`status status-${status}`}>
      <span className="dot" aria-hidden="true" />
      {t(`status.${status}` as const)}
    </span>
  );
}

/** Preview: Bild (lazy, WebP) oder generativer Fallback. Bei Ladefehler automatisch Fallback. */
export function Preview({ project, active, eager = false }: { project: Project; active: boolean; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (project.preview && !failed) {
    return (
      <img
        src={project.preview}
        alt={`Screenshot von ${project.title}`}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        width={960}
        height={600}
        onError={() => setFailed(true)}
      />
    );
  }
  return <GenerativePreview name={project.name} active={active} label={`Generierte Vorschau für ${project.title}`} />;
}

interface Props {
  project: Project;
  featured?: boolean;
  onOpen: (p: Project) => void;
}

function ProjectCard({ project: p, featured = false, onOpen }: Props) {
  const { t, lang } = useI18n();
  const ref = useRef<HTMLElement>(null);
  const [hover, setHover] = useState(false);
  const canTilt = !isTouch() && !prefersReducedMotion();

  /** 3D-Tilt + Glow-Position über CSS-Variablen (kein React-Re-Render pro Mausbewegung). */
  const onMove = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    el.style.setProperty('--mx', `${x * 100}%`);
    el.style.setProperty('--my', `${y * 100}%`);
    if (canTilt) {
      const k = featured ? 5 : 8;
      el.style.setProperty('--rx', `${clamp((0.5 - y) * k, -k, k)}deg`);
      el.style.setProperty('--ry', `${clamp((x - 0.5) * k * 1.2, -k, k)}deg`);
    }
  };
  const onEnter = () => {
    setHover(true);
    ref.current?.classList.add('is-tilting');
  };
  const onLeave = () => {
    setHover(false);
    const el = ref.current;
    if (!el) return;
    el.classList.remove('is-tilting');
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  const desc = p.description[lang] || t('card.noDesc');
  const isGame = p.type === 'game';
  const tags = [...p.topics].slice(0, featured ? 4 : 3);

  return (
    <article
      ref={ref}
      className={`card reveal h-full ${featured ? 'is-featured' : ''}`}
      style={{ ['--hue' as string]: projectHue(p.name) }}
      onPointerMove={onMove}
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      aria-labelledby={`t-${p.name}`}
    >
      <div className="card-inner">
        {/* Vollflächiger Button öffnet die Detailansicht; Links liegen per z-index darüber */}
        <button
          type="button"
          className="card-stretch"
          onClick={() => onOpen(p)}
          aria-label={`${t('card.details')}: ${p.title}`}
        />

        <div className="card-preview">
          <Preview project={p} active={hover} />
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[2] flex items-start justify-between p-3">
            <StatusBadge status={p.status} />
            <span className="tag !bg-[rgba(5,7,10,.7)] backdrop-blur">{t(`type.${p.type}` as const)}</span>
          </div>
          {hover && !prefersReducedMotion() && <span className="scan-sweep" aria-hidden="true" />}
        </div>

        <div className="card-body flex flex-col gap-3">
          <div>
            <h3 id={`t-${p.name}`} className="card-title">
              {p.title}
            </h3>
            <p className="card-desc mt-1.5">{desc}</p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {p.language && (
              <span className="tag gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: langColor(p.language) }} aria-hidden="true" />
                {p.language}
              </span>
            )}
            {tags.map((tg) => (
              <span key={tg} className="tag">
                #{tg}
              </span>
            ))}
          </div>

          <div className="mt-auto flex items-center justify-between gap-3 pt-1">
            <div className="mono flex items-center gap-3 text-[11.5px] text-ink-faint">
              <span className="inline-flex items-center gap-1" title={t('modal.stars')}>
                <StarIcon /> {p.stars}
              </span>
              <span>{relativeTime(p.updatedAt, lang)}</span>
            </div>
            <div className="card-actions flex items-center gap-2">
              <a
                href={p.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="icon-btn !h-[38px] !w-[38px]"
                aria-label={`${p.title} ${t('card.github')}`}
              >
                <GitHubIcon />
              </a>
              {p.url ? (
                <a href={p.url} target="_blank" rel="noopener noreferrer" className="play-pill" aria-label={`${p.title} ${isGame ? t('card.play') : t('card.open')}`}>
                  <span className="tri" aria-hidden="true" />
                  {(isGame ? t('card.play') : t('card.open')).toUpperCase()}
                  <span className="arr" aria-hidden="true">
                    <span>→</span>
                  </span>
                </a>
              ) : (
                <a href={p.repoUrl} target="_blank" rel="noopener noreferrer" className="play-pill is-code">
                  {'</>'} {t('card.code')}
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default memo(ProjectCard);

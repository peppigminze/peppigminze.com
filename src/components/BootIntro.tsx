import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { gsap } from '../lib/scroll';

interface Props {
  repoCount: number | null;
  onDone: () => void;
}

/**
 * Terminal-Bootsequenz. Gesamtdauer ≈ 2.2 s, jederzeit per Klick/Taste überspringbar.
 * Läuft einmal pro Browser-Session.
 */
export default function BootIntro({ repoCount, onDone }: Props) {
  const { t } = useI18n();
  const root = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [pct, setPct] = useState(0);
  const done = useRef(false);
  const countRef = useRef(repoCount);
  countRef.current = repoCount;

  const lines = [
    { text: 'INITIALIZING PEPPIGMINZE', ok: 'OK' },
    { text: 'MOUNTING /dev/projects', ok: 'OK' },
    { text: 'LOADING REPOS', ok: () => (countRef.current != null ? String(countRef.current).padStart(2, '0') : 'OK') },
    { text: 'SYNCING GITHUB TELEMETRY', ok: 'OK' },
  ];

  const exit = () => {
    if (done.current) return;
    done.current = true;
    const el = root.current;
    if (!el) return onDone();
    gsap.to(el, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 0.5,
      ease: 'power3.inOut',
      onComplete: onDone,
    });
  };

  useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    const timers = [0, 1, 2, 3, 4].map((i) => window.setTimeout(() => setStep(i + 1), 150 + i * 340));
    const o = { v: 0 };
    const prog = gsap.to(o, { v: 100, duration: 1.65, ease: 'power1.inOut', onUpdate: () => setPct(Math.round(o.v)) });
    const end = window.setTimeout(exit, 1800);
    const skip = () => exit();
    window.addEventListener('keydown', skip);
    window.addEventListener('pointerdown', skip);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(end);
      prog.kill();
      window.removeEventListener('keydown', skip);
      window.removeEventListener('pointerdown', skip);
      document.documentElement.style.overflow = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bar = Math.round(pct / 5);

  return (
    <div ref={root} className="boot" style={{ clipPath: 'inset(0 0 0% 0)' }} role="status" aria-live="polite">
      <div className="mono w-[min(92vw,560px)] text-[12.5px] sm:text-[13.5px] leading-[1.9] text-ink-muted">
        <div className="mb-5 flex items-center justify-between text-[11px] text-ink-faint">
          <span>pm-os 1.0 · tty0</span>
          <span>{new Date().toISOString().slice(0, 10)}</span>
        </div>
        {lines.map((l, i) => (
          <div key={l.text} className="flex gap-3" style={{ visibility: step > i ? 'visible' : 'hidden' }}>
            <span className="text-mint">&gt;</span>
            <span className="shrink-0 text-ink">{l.text}</span>
            <span className="min-w-[1.5ch] flex-1 overflow-hidden whitespace-nowrap text-ink-faint" aria-hidden="true">
              {'.'.repeat(80)}
            </span>
            <span className="text-mint">[{typeof l.ok === 'function' ? l.ok() : l.ok}]</span>
          </div>
        ))}
        <div className="mt-1 flex gap-3" style={{ visibility: step > 4 ? 'visible' : 'hidden' }}>
          <span className="text-mint">&gt;</span>
          <span className="font-bold text-mint" style={{ textShadow: '0 0 14px rgba(61,255,181,.7)' }}>
            ONLINE
          </span>
          <span className="boot-caret" />
        </div>
        <div className="mt-6 flex items-center gap-3 text-[11px]">
          <span className="text-mint" aria-hidden="true">
            [{'█'.repeat(bar)}
            <span className="text-ink-faint">{'░'.repeat(20 - bar)}</span>]
          </span>
          <span className="tabular-nums text-ink">{String(pct).padStart(3, ' ')}%</span>
        </div>
        <p className="mt-8 text-[11px] text-ink-faint">{t('boot.skip')}</p>
      </div>
    </div>
  );
}

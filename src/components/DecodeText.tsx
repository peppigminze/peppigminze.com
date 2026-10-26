import { useEffect, useRef, useState } from 'react';
import { prefersReducedMotion } from '../lib/motion';

const GLYPHS = '01<>/\\[]{}#$%&*+=?ABCDEFGHJKLMNPQRSTUVWXYZ░▒▓';

/**
 * Decode-Effekt: Buchstaben laufen als Zufallszeichen durch und "rasten" links→rechts ein.
 * Danach in Abständen ein kurzer RGB-Glitch (und bei Hover).
 */
export default function DecodeText({ text, start, className = '' }: { text: string; start: boolean; className?: string }) {
  const [chars, setChars] = useState<{ c: string; locked: boolean }[]>(() =>
    text.split('').map((c) => ({ c: prefersReducedMotion() ? c : '\u00a0', locked: prefersReducedMotion() })),
  );
  const [glitch, setGlitch] = useState(false);
  const el = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!start || prefersReducedMotion()) {
      setChars(text.split('').map((c) => ({ c, locked: true })));
      return;
    }
    const total = 1100;
    const t0 = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const p = (now - t0) / total;
      setChars(
        text.split('').map((c, i) => {
          const lockAt = 0.15 + (i / text.length) * 0.8;
          if (p >= lockAt) return { c, locked: true };
          if (p < (i / text.length) * 0.35) return { c: '\u00a0', locked: false };
          return { c: GLYPHS[(Math.random() * GLYPHS.length) | 0], locked: false };
        }),
      );
      if (p < 1) raf = requestAnimationFrame(tick);
      else pulse();
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [start, text]);

  const pulse = () => {
    setGlitch(true);
    window.setTimeout(() => setGlitch(false), 440);
  };

  // gelegentlicher Glitch
  useEffect(() => {
    if (!start || prefersReducedMotion()) return;
    const id = window.setInterval(pulse, 7000);
    return () => window.clearInterval(id);
  }, [start]);

  return (
    <span
      ref={el}
      className={`glitch ${glitch ? 'is-glitching' : ''} ${className}`}
      data-text={text}
      onPointerEnter={() => !prefersReducedMotion() && pulse()}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {chars.map((ch, i) => (
          <span key={i} className={`ch ${ch.locked ? '' : 'scramble'}`}>
            {ch.c}
          </span>
        ))}
      </span>
    </span>
  );
}

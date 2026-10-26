import { useEffect, useState } from 'react';
import { prefersReducedMotion } from '../lib/motion';

/** Tippt Text Zeichen für Zeichen. Screenreader bekommen den vollen Text sofort. */
export default function Typewriter({ text, start, delay = 0, speed = 24 }: { text: string; start: boolean; delay?: number; speed?: number }) {
  const [n, setN] = useState(prefersReducedMotion() ? text.length : 0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setN(text.length);
      setDone(true);
      return;
    }
    if (!start) return;
    setN(0);
    setDone(false);
    let i = 0;
    let id = 0;
    const t = window.setTimeout(() => {
      id = window.setInterval(() => {
        i++;
        setN(i);
        if (i >= text.length) {
          window.clearInterval(id);
          setDone(true);
        }
      }, speed);
    }, delay);
    return () => {
      window.clearTimeout(t);
      window.clearInterval(id);
    };
  }, [start, text, delay, speed]);

  return (
    <>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {text.slice(0, n)}
        <span className="type-caret" style={{ opacity: done ? 0.6 : 1 }} />
        {/* unsichtbarer Rest hält die Höhe stabil → kein Layout-Shift */}
        <span style={{ visibility: 'hidden' }}>{text.slice(n)}</span>
      </span>
    </>
  );
}

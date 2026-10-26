import { useEffect } from 'react';

const SEQ = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];

/** ↑ ↑ ↓ ↓ ← → ← → B A */
export function useKonami(cb: () => void) {
  useEffect(() => {
    let i = 0;
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      i = k === SEQ[i] ? i + 1 : k === SEQ[0] ? 1 : 0;
      if (i === SEQ.length) {
        i = 0;
        cb();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cb]);
}

/** Motion-/Geräte-Erkennung. Wird einmal beim Laden ausgewertet und live aktualisiert. */
const mq = (q: string) => (typeof window !== 'undefined' ? window.matchMedia(q) : null);

export const reducedMotionQuery = mq('(prefers-reduced-motion: reduce)');
export const coarsePointerQuery = mq('(pointer: coarse)');

export const prefersReducedMotion = () => !!reducedMotionQuery?.matches;
export const isTouch = () => !!coarsePointerQuery?.matches;

/** Grobe Einschätzung schwacher Geräte → Effekte abspecken. */
export const isLowPower = () =>
  isTouch() || (navigator.hardwareConcurrency ?? 8) <= 4 || window.innerWidth < 768;

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

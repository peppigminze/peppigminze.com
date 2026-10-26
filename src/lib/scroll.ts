import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from './motion';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

/** Lenis (Smooth Scroll) mit GSAP-Ticker koppeln. Bei Reduced Motion: natives Scrollen. */
export function initSmoothScroll() {
  if (prefersReducedMotion() || lenis) return lenis;
  lenis = new Lenis({ duration: 1.15, easing: (t) => 1 - Math.pow(1 - t, 4), touchMultiplier: 1.4 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis?.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  return lenis;
}

export const getLenis = () => lenis;

/** Zu einem Element/Anker scrollen – mit Lenis falls aktiv. */
export function scrollToTarget(target: string | HTMLElement | number) {
  if (lenis) {
    lenis.scrollTo(target as never, { offset: typeof target === 'number' ? 0 : -72 });
    return;
  }
  if (typeof target === 'number') window.scrollTo({ top: target, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  else {
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    el?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }
}

export function lockScroll(lock: boolean) {
  if (lenis) (lock ? lenis.stop() : lenis.start());
  document.documentElement.style.overflow = lock ? 'hidden' : '';
}

export { gsap, ScrollTrigger };

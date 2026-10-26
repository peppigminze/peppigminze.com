import { useEffect, useRef } from 'react';

/**
 * Custom Cursor: Punkt (direkt) + Ring (verzögert) + leuchtende Spur (Canvas).
 * Morpht je nach Ziel: Links/Buttons → größerer Ring, Karten → gefüllter Kreis mit Label,
 * Eingabefelder → Textcursor. Nur auf Geräten mit Maus aktiv (in App.tsx geprüft).
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const label = useRef<HTMLSpanElement>(null);
  const trail = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    document.documentElement.classList.add('has-cursor');
    const cv = trail.current!;
    const ctx = cv.getContext('2d')!;
    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    const pos = { x: -100, y: -100 };
    const rp = { x: -100, y: -100 };
    const pts: { x: number; y: number; life: number }[] = [];
    let raf = 0;
    let idle = 0;
    let running = false;
    let shown = false;

    const resize = () => {
      cv.width = innerWidth * DPR;
      cv.height = innerHeight * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };
    resize();

    const loop = () => {
      rp.x += (pos.x - rp.x) * 0.2;
      rp.y += (pos.y - rp.y) * 0.2;
      dot.current!.style.transform = `translate3d(${pos.x}px,${pos.y}px,0)`;
      ring.current!.style.transform = `translate3d(${rp.x}px,${rp.y}px,0)`;

      // Spur: Punkte altern, als weich auslaufende Linie zeichnen
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (const p of pts) p.life -= 0.06;
      while (pts.length && pts[0].life <= 0) pts.shift();
      if (pts.length > 1) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#3DFFB5';
        ctx.shadowBlur = 12;
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1];
          const b = pts[i];
          ctx.strokeStyle = `rgba(61,255,181,${b.life * 0.5})`;
          ctx.lineWidth = b.life * 3;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
        ctx.shadowBlur = 0;
      }

      idle++;
      const settled = Math.abs(pos.x - rp.x) < 0.1 && Math.abs(pos.y - rp.y) < 0.1 && pts.length === 0;
      if (settled && idle > 10) {
        running = false;
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    const wake = () => {
      idle = 0;
      if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      pos.x = e.clientX;
      pos.y = e.clientY;
      if (!shown) {
        rp.x = pos.x;
        rp.y = pos.y;
        shown = true;
        document.documentElement.classList.remove('cursor-hidden');
      }
      pts.push({ x: pos.x, y: pos.y, life: 1 });
      if (pts.length > 24) pts.shift();
      wake();
    };

    const setMode = (el: Element | null) => {
      const r = ring.current!;
      r.classList.remove('is-link', 'is-card', 'is-text');
      if (!el) return;
      const c = el.closest<HTMLElement>('[data-cursor]');
      if (c?.dataset.cursor === 'card') {
        r.classList.add('is-card');
        label.current!.textContent = (c.dataset.cursorLabel || '').toUpperCase();
        return;
      }
      if (el.closest('input[type="search"],input[type="text"],textarea')) return r.classList.add('is-text');
      if (el.closest('a,button,select,label,[role="button"]')) r.classList.add('is-link');
    };
    const onOver = (e: PointerEvent) => setMode(e.target as Element);
    const onDown = () => ring.current!.animate([{ scale: 1 }, { scale: 0.8 }, { scale: 1 }], { duration: 280, easing: 'ease-out' });
    const onLeaveDoc = () => {
      document.documentElement.classList.add('cursor-hidden');
      shown = false;
    };

    document.documentElement.classList.add('cursor-hidden');
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerover', onOver);
    window.addEventListener('pointerdown', onDown);
    document.documentElement.addEventListener('pointerleave', onLeaveDoc);
    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('has-cursor', 'cursor-hidden');
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerover', onOver);
      window.removeEventListener('pointerdown', onDown);
      document.documentElement.removeEventListener('pointerleave', onLeaveDoc);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div aria-hidden="true">
      <canvas ref={trail} className="cursor-layer h-screen w-screen" />
      <div ref={ring} className="cursor-ring">
        <span ref={label} className="cursor-label" />
      </div>
      <div ref={dot} className="cursor-dot" />
    </div>
  );
}

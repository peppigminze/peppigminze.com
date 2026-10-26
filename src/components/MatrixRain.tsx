import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '../lib/motion';

/** Easter Egg: Matrix-Regen in Minze, ~4 s, danach Ausblenden. */
export default function MatrixRain({ onDone }: { onDone: () => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const msg = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      const id = window.setTimeout(onDone, 2200);
      return () => window.clearTimeout(id);
    }
    const cv = ref.current!;
    const ctx = cv.getContext('2d')!;
    const w = (cv.width = innerWidth);
    const h = (cv.height = innerHeight);
    const size = w < 600 ? 14 : 18;
    const cols = Math.ceil(w / size);
    const drops = Array.from({ length: cols }, () => Math.random() * -40);
    const glyphs = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ0123456789PEPPIGMINZE<>/*+';
    const t0 = performance.now();
    let raf = 0;
    const loop = (now: number) => {
      const el = now - t0;
      ctx.fillStyle = 'rgba(5,7,10,0.14)';
      ctx.fillRect(0, 0, w, h);
      ctx.font = `600 ${size}px "JetBrains Mono Variable", monospace`;
      for (let i = 0; i < cols; i++) {
        const ch = glyphs[(Math.random() * glyphs.length) | 0];
        const y = drops[i] * size;
        ctx.fillStyle = Math.random() > 0.96 ? '#E4F5EE' : '#3DFFB5';
        ctx.fillText(ch, i * size, y);
        if (y > h && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 0.9;
      }
      cv.style.opacity = String(el < 3200 ? 1 : Math.max(0, 1 - (el - 3200) / 800));
      if (el < 4000) raf = requestAnimationFrame(loop);
      else onDone();
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-[140]" role="status" aria-live="polite" onClick={onDone}>
      <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />
      <div ref={msg} className="absolute inset-0 grid place-items-center">
        <div className="mono rounded-lg border border-mint bg-[rgba(5,7,10,.85)] px-6 py-4 text-center text-mint shadow-[0_0_40px_-6px_#3DFFB5]">
          <div className="text-[13px] tracking-[0.3em]">ACCESS GRANTED</div>
          <div className="mt-1 text-[11px] text-ink-muted">+30 lives · cheat aktiviert</div>
        </div>
      </div>
    </div>
  );
}

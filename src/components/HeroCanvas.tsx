import { useEffect, useRef } from 'react';
import { hashString } from '../lib/hash';
import { isLowPower, isTouch, prefersReducedMotion } from '../lib/motion';
import type { Project } from '../types';

/**
 * Hero-Hintergrund (Canvas 2D – bewusst kein WebGL: kleiner, schneller Start, überall stabil):
 *  1. Partikelnetz, das auf die Maus reagiert (Abstoßung + Verbindungslinien zum Cursor)
 *  2. Radar mit Sweep – jedes Projekt ist ein "Satellit" auf einer Umlaufbahn
 *     (innen Tools, Mitte Apps, außen Games). Der Sweep "pingt" Satelliten an.
 * Pausiert automatisch, wenn außerhalb des Viewports oder Tab im Hintergrund.
 */

type Sat = { name: string; ring: number; angle: number; speed: number; live: boolean; ping: number };

const MINT = '61,255,181';
const CYAN = '60,215,255';
const VIOLET = '139,108,255';

export default function HeroCanvas({ projects }: { projects: Project[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const satsRef = useRef<Sat[]>([]);
  const redraw = useRef<(() => void) | null>(null);

  // Satelliten aus Projekten ableiten (deterministisch aus dem Namen)
  useEffect(() => {
    const ringOf = { tool: 0, app: 1, game: 2 } as const;
    satsRef.current = projects.map((p) => {
      const h = hashString(p.name);
      return {
        name: p.name.toLowerCase(),
        ring: ringOf[p.type] ?? 2,
        angle: ((h % 3600) / 3600) * Math.PI * 2,
        speed: (0.012 + ((h >> 8) % 100) / 9000) * (h & 1 ? 1 : -1),
        live: p.status === 'live',
        ping: 0,
      };
    });
    redraw.current?.();
  }, [projects]);

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d', { alpha: true })!;
    const reduced = prefersReducedMotion();
    const low = isLowPower();
    const touch = isTouch();
    const DPR = Math.min(window.devicePixelRatio || 1, low ? 1.25 : 1.75);

    let w = 0;
    let h = 0;
    let raf = 0;
    let running = false;
    let visible = true;
    let last = performance.now();
    let sweep = -Math.PI / 2;
    const mouse = { x: -9999, y: -9999, tx: -9999, ty: -9999, px: 0, py: 0 };

    type P = { x: number; y: number; vx: number; vy: number; r: number };
    let pts: P[] = [];

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * DPR);
      canvas.height = Math.round(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const target = Math.round(Math.min(low ? 46 : 110, Math.max(28, (w * h) / (low ? 17000 : 12500))));
      pts = Array.from({ length: target }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        r: Math.random() * 1.3 + 0.4,
      }));
    };

    const radarGeom = () => {
      const mobile = w < 768;
      const cx = (mobile ? w * 0.62 : w * 0.7) + mouse.px * 14;
      const cy = (mobile ? h * 0.36 : h * 0.48) + mouse.py * 10;
      const R = mobile ? Math.min(w * 0.62, h * 0.36) : Math.min(w * 0.3, h * 0.42);
      return { cx, cy, R };
    };

    const draw = (dt: number) => {
      ctx.clearRect(0, 0, w, h);
      if (mouse.tx < -999 || mouse.x < -999) {
        mouse.x = mouse.tx;
        mouse.y = mouse.ty;
      } else {
        mouse.x += (mouse.tx - mouse.x) * 0.12;
        mouse.y += (mouse.ty - mouse.y) * 0.12;
      }
      if (mouse.tx > -999) {
        mouse.px += ((mouse.tx / w - 0.5) - mouse.px) * 0.05;
        mouse.py += ((mouse.ty / h - 0.5) - mouse.py) * 0.05;
      }

      // ---------- Partikelnetz ----------
      const LINK = low ? 110 : 132;
      const LINK2 = LINK * LINK;
      for (const p of pts) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < -20) p.x = w + 20;
        else if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        else if (p.y > h + 20) p.y = -20;
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 22000 && d2 > 1) {
          const f = (1 - d2 / 22000) * 0.9;
          const d = Math.sqrt(d2);
          p.x += (dx / d) * f;
          p.y += (dy / d) * f;
        }
      }
      ctx.lineWidth = 1;
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i];
        for (let j = i + 1; j < pts.length; j++) {
          const b = pts[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < LINK2) {
            ctx.strokeStyle = `rgba(${MINT},${(1 - d2 / LINK2) * 0.16})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
        // Linien zum Cursor
        const mx = a.x - mouse.x;
        const my = a.y - mouse.y;
        const md = mx * mx + my * my;
        if (md < 36000) {
          ctx.strokeStyle = `rgba(${MINT},${(1 - md / 36000) * 0.5})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }
      for (const p of pts) {
        ctx.fillStyle = `rgba(${MINT},0.55)`;
        ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r);
      }

      // ---------- Radar ----------
      const { cx, cy, R } = radarGeom();
      const rings = [0.38, 0.66, 0.94];

      // Ringe
      ctx.lineWidth = 1;
      rings.forEach((rr, i) => {
        ctx.strokeStyle = `rgba(${MINT},${0.1 + i * 0.03})`;
        ctx.setLineDash(i === 1 ? [2, 6] : []);
        ctx.beginPath();
        ctx.arc(cx, cy, R * rr, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.setLineDash([]);
      // Fadenkreuz + Gradstriche
      ctx.strokeStyle = `rgba(${MINT},0.08)`;
      ctx.beginPath();
      ctx.moveTo(cx - R * 1.08, cy);
      ctx.lineTo(cx + R * 1.08, cy);
      ctx.moveTo(cx, cy - R * 1.08);
      ctx.lineTo(cx, cy + R * 1.08);
      ctx.stroke();
      for (let i = 0; i < 72; i++) {
        const a = (i / 72) * Math.PI * 2;
        const len = i % 6 === 0 ? 9 : 4;
        ctx.strokeStyle = `rgba(${MINT},${i % 6 === 0 ? 0.32 : 0.14})`;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R);
        ctx.lineTo(cx + Math.cos(a) * (R + len), cy + Math.sin(a) * (R + len));
        ctx.stroke();
      }

      // Sweep (Kegel mit Verlauf)
      sweep += dt * 0.012;
      if (typeof ctx.createConicGradient === 'function') {
        const g = ctx.createConicGradient(sweep - 1.2, cx, cy);
        g.addColorStop(0, `rgba(${MINT},0)`);
        g.addColorStop(0.19, `rgba(${MINT},0.13)`);
        g.addColorStop(0.191, `rgba(${MINT},0)`);
        g.addColorStop(1, `rgba(${MINT},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, R, sweep - 1.2, sweep);
        ctx.closePath();
        ctx.fill();
      }
      ctx.strokeStyle = `rgba(${MINT},0.65)`;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweep) * R, cy + Math.sin(sweep) * R);
      ctx.stroke();

      // Satelliten
      ctx.font = `500 10px "JetBrains Mono Variable", ui-monospace, monospace`;
      ctx.textBaseline = 'middle';
      const sw = ((sweep % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      for (const s of satsRef.current) {
        s.angle += s.speed * dt * 0.016;
        const a = ((s.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        let diff = sw - a;
        if (diff < 0) diff += Math.PI * 2;
        if (diff < 0.05) s.ping = 1; // Sweep trifft Satellit
        s.ping = Math.max(0, s.ping - dt * 0.012);

        const rr = R * rings[s.ring];
        const x = cx + Math.cos(s.angle) * rr;
        const y = cy + Math.sin(s.angle) * rr;
        const col = s.ring === 0 ? VIOLET : s.ring === 1 ? CYAN : MINT;
        const glow = 0.45 + s.ping * 0.55;

        if (s.ping > 0) {
          ctx.strokeStyle = `rgba(${col},${s.ping * 0.6})`;
          ctx.beginPath();
          ctx.arc(x, y, 4 + (1 - s.ping) * 16, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.fillStyle = `rgba(${col},${glow})`;
        ctx.beginPath();
        ctx.arc(x, y, s.live ? 3.2 : 2.4, 0, Math.PI * 2);
        ctx.fill();
        if (s.live) {
          ctx.strokeStyle = `rgba(${col},0.5)`;
          ctx.strokeRect(x - 6, y - 6, 12, 12);
        }
        // Label mit kurzer Leitlinie
        const lx = x + 10;
        const ly = y - 10;
        ctx.strokeStyle = `rgba(${col},${0.2 + s.ping * 0.4})`;
        ctx.beginPath();
        ctx.moveTo(x + 3, y - 3);
        ctx.lineTo(lx, ly);
        ctx.lineTo(lx + 8, ly);
        ctx.stroke();
        ctx.fillStyle = `rgba(228,245,238,${0.32 + s.ping * 0.6})`;
        ctx.fillText(s.name, lx + 11, ly);
      }
      // Zentrum
      ctx.fillStyle = `rgba(${MINT},0.9)`;
      ctx.beginPath();
      ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
      ctx.fill();
    };

    const loop = (now: number) => {
      const dt = Math.min(3, (now - last) / 16.67); // normiert auf 60 fps
      last = now;
      draw(dt);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || reduced || !visible || document.hidden) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    resize();
    draw(1);
    redraw.current = () => !running && draw(0);
    start();

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      visible ? start() : stop();
    });
    io.observe(canvas);
    const ro = new ResizeObserver(() => {
      resize();
      if (!running) draw(0);
    });
    ro.observe(canvas);
    const onVis = () => (document.hidden ? stop() : start());
    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = e.clientX - r.left;
      mouse.ty = e.clientY - r.top;
    };
    const onLeave = () => {
      mouse.tx = -9999;
      mouse.ty = -9999;
    };
    document.addEventListener('visibilitychange', onVis);
    if (!touch) {
      window.addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('pointerleave', onLeave);
    }
    // Statischer Frame nach Font-Load (Labels), falls reduziert
    document.fonts?.ready.then(() => !running && draw(0));

    return () => {
      stop();
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" aria-hidden="true" />;
}

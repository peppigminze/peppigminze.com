import { useEffect, useRef } from 'react';
import { hashString, projectHue, rng } from '../lib/hash';
import { prefersReducedMotion } from '../lib/motion';

/**
 * Fallback-Preview, wenn kein Bild existiert. Deterministisch aus dem Repo-Namen:
 * gleicher Name → gleiches Muster + gleiche Farbe. Vier Muster-Familien.
 * Animiert nur, solange `active` (Hover/Modal) → spart Akku & CPU.
 */
type Pattern = 'terrain' | 'orbits' | 'cells' | 'flow';
const PATTERNS: Pattern[] = ['terrain', 'orbits', 'cells', 'flow'];

export default function GenerativePreview({ name, active, label }: { name: string; active: boolean; label?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);
  const kick = useRef<() => void>(() => {});
  activeRef.current = active;

  useEffect(() => {
    const canvas = ref.current!;
    const ctx = canvas.getContext('2d')!;
    const seed = hashString(name);
    const pattern = PATTERNS[seed % PATTERNS.length];
    const hue = projectHue(name);
    const hue2 = (hue + 40 + (seed % 50)) % 360;
    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    let w = 0;
    let h = 0;
    let t = (seed % 1000) / 10; // Startframe je Projekt unterschiedlich
    let raf = 0;
    let running = false;

    // Vorberechnete, seed-abhängige Parameter
    const r = rng(seed);
    const P = {
      lines: 18 + Math.floor(r() * 10),
      amp: 0.5 + r() * 0.7,
      freq: 1.5 + r() * 3,
      orbits: 4 + Math.floor(r() * 4),
      tilt: 0.25 + r() * 0.5,
      cell: 14 + Math.floor(r() * 10),
      flowN: 160,
      ff: 0.004 + r() * 0.006,
      peak: 0.3 + r() * 0.4,
      ocx: 0.35 + r() * 0.3,
      orot: -0.7 + r() * 1.4,
    };
    let flow: { x: number; y: number; life: number }[] = [];

    const resize = () => {
      const b = canvas.getBoundingClientRect();
      w = Math.max(1, b.width);
      h = Math.max(1, b.height);
      canvas.width = Math.round(w * DPR);
      canvas.height = Math.round(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      const fr = rng(seed + 7);
      flow = Array.from({ length: P.flowN }, () => ({ x: fr() * w, y: fr() * h, life: fr() * 200 }));
      paintBase();
    };

    const paintBase = () => {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, `hsl(${hue} 60% 6%)`);
      g.addColorStop(1, `hsl(${hue2} 50% 4%)`);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    };

    // Kleines, schnelles Pseudo-Noise (Summe von Sinus) – reicht für die Optik
    const ph = [r() * 6.28, r() * 6.28, r() * 6.28, r() * 6.28];
    const n2 = (x: number, y: number) =>
      Math.sin(x * 1.7 + ph[0]) * 0.36 +
      Math.sin(y * 2.3 + x * 0.71 + ph[1]) * 0.3 +
      Math.sin((x * 0.83 - y * 1.37) * 2.13 + ph[2]) * 0.22 +
      Math.sin(Math.hypot(x - 2.1, y - 1.3) * 3.7 + ph[3]) * 0.18;

    const frame = () => {
      if (pattern !== 'flow') paintBase();
      if (pattern === 'terrain') {
        // "Joy Division"-artige Höhenlinien
        const rows = P.lines;
        for (let i = 0; i < rows; i++) {
          const y0 = h * 0.18 + (i / rows) * h * 0.78;
          const line = new Path2D();
          for (let x = -6; x <= w + 6; x += 6) {
            const nx = x / w;
            const center = Math.exp(-Math.pow((nx - P.peak) * 2.6, 2));
            const y = y0 - Math.max(0, n2(nx * P.freq + t * 0.02, i * 0.3) + 0.25) * h * 0.2 * P.amp * center;
            x === -6 ? line.moveTo(x, y) : line.lineTo(x, y);
          }
          const fill = new Path2D(line);
          fill.lineTo(w + 6, h + 6);
          fill.lineTo(-6, h + 6);
          fill.closePath();
          ctx.fillStyle = `hsl(${hue} 55% 5%)`;
          ctx.fill(fill);
          ctx.strokeStyle = `hsla(${i % 4 === 0 ? hue2 : hue} 100% 65% / ${0.25 + (i / rows) * 0.6})`;
          ctx.lineWidth = 1;
          ctx.stroke(line);
        }
      } else if (pattern === 'orbits') {
        const cx = w * P.ocx;
        const cy = h * 0.55;
        const rot = P.orot;
        for (let i = 0; i < P.orbits; i++) {
          const rx = Math.min(w, h * 1.7) * (0.12 + i * 0.075);
          const ry = rx * P.tilt;
          ctx.strokeStyle = `hsla(${hue} 100% 65% / ${0.18 + i * 0.05})`;
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
          ctx.stroke();
          const a = t * (0.02 + (P.orbits - i) * 0.006) + i * 1.7;
          const px = cx + Math.cos(a) * rx * Math.cos(rot) - Math.sin(a) * ry * Math.sin(rot);
          const py = cy + Math.cos(a) * rx * Math.sin(rot) + Math.sin(a) * ry * Math.cos(rot);
          ctx.fillStyle = `hsl(${i % 2 ? hue2 : hue} 100% 70%)`;
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 12;
          ctx.beginPath();
          ctx.arc(px, py, 2.5 + (i % 3), 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
        const core = Math.min(w, h * 1.7) * 0.09;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, core);
        g.addColorStop(0, `hsla(${hue} 100% 70% / .9)`);
        g.addColorStop(1, `hsla(${hue} 100% 50% / 0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, core, 0, Math.PI * 2);
        ctx.fill();
      } else if (pattern === 'cells') {
        const s = Math.max(P.cell, Math.round(w / 34));
        for (let y = 0; y < h; y += s) {
          for (let x = 0; x < w; x += s) {
            const v = n2((x / w) * 4.2 + t * 0.01, (y / h) * 3.1 - t * 0.008);
            if (v > 0.25) {
              ctx.fillStyle = `hsla(${v > 0.6 ? hue2 : hue} 100% 62% / ${(v - 0.25) * 1.1})`;
              ctx.fillRect(x + 1, y + 1, s - 3, s - 3);
            } else {
              ctx.fillStyle = `hsla(${hue} 80% 50% / .05)`;
              ctx.fillRect(x + s / 2 - 1, y + s / 2 - 1, 2, 2);
            }
          }
        }
      } else {
        // flow: Partikel mit Spuren
        ctx.fillStyle = `hsla(${hue} 60% 4% / .09)`;
        ctx.fillRect(0, 0, w, h);
        ctx.lineWidth = 1.1;
        for (const p of flow) {
          const a = n2(p.x * P.ff * 3, p.y * P.ff * 3 + t * 0.004) * Math.PI * 2;
          const nx = p.x + Math.cos(a) * 1.6;
          const ny = p.y + Math.sin(a) * 1.6;
          ctx.strokeStyle = `hsla(${p.life % 3 < 1 ? hue2 : hue} 100% 65% / .55)`;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(nx, ny);
          ctx.stroke();
          p.x = nx;
          p.y = ny;
          p.life--;
          if (p.life < 0 || p.x < 0 || p.x > w || p.y < 0 || p.y > h) {
            p.x = Math.random() * w;
            p.y = Math.random() * h;
            p.life = 80 + Math.random() * 160;
          }
        }
      }
      // HUD-Detail: Seed als Hex unten rechts
      ctx.font = '500 10px "JetBrains Mono Variable", ui-monospace, monospace';
      ctx.fillStyle = `hsla(${hue} 100% 75% / .45)`;
      ctx.textAlign = 'right';
      ctx.fillText(`0x${seed.toString(16).padStart(8, '0')}`, w - 12, h - 12);
      ctx.textAlign = 'left';
    };

    const loop = () => {
      t += 1;
      frame();
      if (activeRef.current) raf = requestAnimationFrame(loop);
      else running = false;
    };
    kick.current = () => {
      if (running || prefersReducedMotion()) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };

    resize();
    // Flow braucht Vorlauf, damit der Standbild-Frame nicht leer wirkt
    if (pattern === 'flow') for (let i = 0; i < 90; i++) { t += 1; frame(); }
    else frame();
    if (activeRef.current) kick.current();

    const ro = new ResizeObserver(() => {
      resize();
      if (pattern === 'flow') for (let i = 0; i < 60; i++) frame();
      else frame();
    });
    ro.observe(canvas);
    document.fonts?.ready.then(() => !running && pattern !== 'flow' && frame());
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [name]);

  useEffect(() => {
    if (active) kick.current();
  }, [active]);

  return <canvas ref={ref} role="img" aria-label={label ?? `Generierte Vorschau für ${name}`} />;
}

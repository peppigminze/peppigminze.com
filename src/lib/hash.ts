/** Deterministischer 32-bit Hash (FNV-1a) → gleiche Zahl für gleichen Repo-Namen. */
export function hashString(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Kleiner, schneller Seeded-PRNG (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Projekt-Farbe: Hue im Minze→Cyan→Violett-Band, damit alles zur Marke passt. */
export function projectHue(name: string): number {
  const h = hashString(name);
  const band = [158, 168, 176, 186, 194, 205, 250, 262, 272];
  return band[h % band.length];
}

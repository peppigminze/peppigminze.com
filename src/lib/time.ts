import type { Lang } from '../types';

const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['week', 604800],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
];

/** "vor 3 Tagen" / "3 days ago" */
export function relativeTime(iso: string | null, lang: Lang): string {
  if (!iso) return '–';
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(lang === 'de' ? 'de-CH' : 'en', { numeric: 'auto' });
  for (const [unit, sec] of UNITS) {
    if (Math.abs(diff) >= sec) return rtf.format(Math.round(diff / sec), unit);
  }
  return rtf.format(0, 'minute');
}

export function formatDate(iso: string | null, lang: Lang): string {
  if (!iso) return '–';
  return new Date(iso).toLocaleDateString(lang === 'de' ? 'de-CH' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

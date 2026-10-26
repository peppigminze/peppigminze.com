import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../i18n';
import { gsap, scrollToTarget } from '../lib/scroll';
import { prefersReducedMotion } from '../lib/motion';
import { LeafLogo } from './Icons';

/** Uhrzeit Schweiz – kleines Cockpit-Detail. Eigene Komponente, damit nur sie jede Sekunde rendert. */
function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString('de-CH', { timeZone: 'Europe/Zurich', hour12: false });
  return (
    <span className="mono hidden text-[11.5px] tabular-nums text-ink-faint lg:inline" aria-hidden="true">
      CH {time}
    </span>
  );
}

export default function Nav({ onLogoEgg }: { onLogoEgg: () => void }) {
  const { t, lang, setLang } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const logo = useRef<HTMLAnchorElement>(null);
  const clicks = useRef<number[]>([]);

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 24);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);

  /** Logo: Klick = nach oben + Blatt-Dreh; 3× schnell = Matrix-Regen (Easter Egg). */
  const onLogo = (e: React.MouseEvent) => {
    e.preventDefault();
    scrollToTarget(0);
    const now = Date.now();
    clicks.current = [...clicks.current.filter((c) => now - c < 900), now];
    if (!prefersReducedMotion()) {
      gsap.fromTo(logo.current!.querySelector('svg'), { rotate: 0 }, { rotate: 360, duration: 0.8, ease: 'back.out(1.6)' });
    }
    if (clicks.current.length >= 3) {
      clicks.current = [];
      onLogoEgg();
    }
  };

  const links = [
    ['#projekte', t('nav.projects')],
    ['#about', t('nav.about')],
    ['#kontakt', t('nav.contact')],
  ] as const;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-[background,border-color,backdrop-filter] duration-300 ${
        scrolled ? 'border-b border-[var(--line)] bg-[rgba(5,7,10,.72)] backdrop-blur-xl' : 'border-b border-transparent'
      }`}
    >
      <nav className="mx-auto flex h-[var(--nav-h)] max-w-[1400px] items-center justify-between gap-4 px-5 sm:px-8" aria-label="Hauptnavigation">
        <a ref={logo} href="#top" onClick={onLogo} className="group flex items-center gap-2.5" aria-label="peppigminze, nach oben">
          <LeafLogo className="h-6 w-6 drop-shadow-[0_0_8px_rgba(61,255,181,.5)]" />
          <span className="mono text-[14px] font-semibold tracking-tight text-ink">
            peppigminze<span className="text-mint">.com</span>
          </span>
        </a>

        <div className="flex items-center gap-1 sm:gap-2">
          <ul className="hidden items-center gap-1 md:flex">
            {links.map(([href, label]) => (
              <li key={href}>
                <a
                  href={href}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToTarget(href);
                  }}
                  className="rounded-full px-3.5 py-2 text-[0.9rem] text-ink-muted transition-colors hover:text-ink"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
          <span className="mx-2 hidden h-4 w-px bg-[var(--line)] lg:block" />
          <Clock />
          <div className="ml-2 flex rounded-full border border-[var(--line)] p-0.5" role="group" aria-label={t('nav.lang')}>
            {(['de', 'en'] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                aria-pressed={lang === l}
                className={`mono h-7 rounded-full px-2.5 text-[11px] font-semibold uppercase transition-colors ${
                  lang === l ? 'bg-mint text-[#02150d]' : 'text-ink-muted hover:text-ink'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </nav>
    </header>
  );
}

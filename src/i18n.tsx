import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Lang } from './types';

/** Alle UI-Texte zweisprachig. Deutsch ist Standard. */
const dict = {
  de: {
    skip: 'Zum Inhalt springen',
    'nav.projects': 'Projekte',
    'nav.about': 'Über mich',
    'nav.contact': 'Kontakt',
    'nav.lang': 'Sprache wechseln',
    'boot.skip': 'Klicken oder Taste drücken zum Überspringen',
    'hero.sub': 'Spiele und Apps aus der Schweiz. Jedes Repo, jeder Build, hier an einem Ort.',
    'hero.cta': 'Projekte ansehen',
    'hero.github': 'GitHub-Profil',
    'hero.tracking': 'Objekte im Orbit',
    'hero.online': 'System online',
    'hero.live': 'live',
    'hero.legend': 'Legende Radar',
    'hero.scroll': 'Scrollen',
    'stats.repos': 'Repositories',
    'stats.commits': 'Commits',
    'stats.stars': 'Sterne',
    'stats.languages': 'Sprachen',
    'stats.synced': 'Synchronisiert',
    'projects.title': 'Alle Projekte',
    'projects.lead': 'Was online ist, kannst du direkt starten. Der Rest ist in Arbeit.',
    'filter.all': 'Alle',
    'filter.game': 'Games',
    'filter.app': 'Apps',
    'filter.tool': 'Tools',
    'filter.label': 'Nach Typ filtern',
    'search.label': 'Projekte durchsuchen',
    'search.placeholder': 'suchen…',
    'sort.label': 'Sortierung',
    'sort.recent': 'Neueste',
    'sort.stars': 'Sterne',
    'sort.az': 'A–Z',
    'empty.title': 'Kein Projekt passt zu deiner Suche.',
    'empty.action': 'Filter zurücksetzen',
    'card.play': 'Spielen',
    'card.open': 'Öffnen',
    'card.code': 'Code ansehen',
    'card.github': 'auf GitHub',
    'card.details': 'Details',
    'card.noDesc': 'Noch keine Beschreibung.',
    'card.updated': 'aktualisiert',
    'status.live': 'Live',
    'status.building': 'Building',
    'status.archived': 'Archiviert',
    'type.game': 'Game',
    'type.app': 'App',
    'type.tool': 'Tool',
    'modal.close': 'Schließen',
    'modal.readme': 'Aus dem README',
    'modal.stack': 'Tech-Stack',
    'modal.facts': 'Fakten',
    'modal.created': 'Erstellt',
    'modal.updated': 'Letztes Update',
    'modal.commits': 'Commits',
    'modal.stars': 'Sterne',
    'modal.noReadme': 'Für dieses Projekt gibt es noch kein README.',
    'about.title': 'Über mich',
    'about.p1': 'Ich bin 17, mache eine Lehre als Informatiker und daneben die Berufsmaturität.',
    'about.p2': 'Abends und am Wochenende baue ich Spiele und Apps, meistens für den Browser. Ziel: Projekte, die Leute wirklich benutzen. Und irgendwann davon leben.',
    'about.p3': 'Sonst: Volleyball, Gym, Cybersecurity, Valorant.',
    'about.lead': 'Informatik-Lernender, 17. Ich baue Dinge, die man im Browser öffnen und sofort benutzen kann.',
    'about.latest': 'zuletzt bearbeitet',
    'contact.github': 'Code, Issues und Updates',
    'contact.title': 'Kontakt',
    'contact.lead': 'Feedback zu einem Spiel, ein Bug oder eine Idee? Schreib mir.',
    'contact.mail': 'E-Mail schreiben',
    'footer.built': 'Gebaut mit Vite, React und GSAP. Daten von der GitHub API.',
    'footer.egg': 'Tipp: ↑ ↑ ↓ ↓ ← → ← → B A',
    'time.now': 'gerade eben',
    'data.fallback': 'Live-Daten direkt von GitHub geladen.',
    'data.error': 'Projekte konnten nicht geladen werden. Lade die Seite neu oder schau direkt auf GitHub.',
  },
  en: {
    skip: 'Skip to content',
    'nav.projects': 'Projects',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.lang': 'Switch language',
    'boot.skip': 'Click or press any key to skip',
    'hero.sub': 'Games and apps from Switzerland. Every repo, every build, in one place.',
    'hero.cta': 'Browse projects',
    'hero.github': 'GitHub profile',
    'hero.tracking': 'objects in orbit',
    'hero.online': 'System online',
    'hero.live': 'live',
    'hero.legend': 'Radar legend',
    'hero.scroll': 'Scroll',
    'stats.repos': 'Repositories',
    'stats.commits': 'Commits',
    'stats.stars': 'Stars',
    'stats.languages': 'Languages',
    'stats.synced': 'Synced',
    'projects.title': 'All projects',
    'projects.lead': 'Anything that’s online you can launch right away. The rest is in progress.',
    'filter.all': 'All',
    'filter.game': 'Games',
    'filter.app': 'Apps',
    'filter.tool': 'Tools',
    'filter.label': 'Filter by type',
    'search.label': 'Search projects',
    'search.placeholder': 'search…',
    'sort.label': 'Sort',
    'sort.recent': 'Newest',
    'sort.stars': 'Stars',
    'sort.az': 'A–Z',
    'empty.title': 'No project matches your search.',
    'empty.action': 'Reset filters',
    'card.play': 'Play',
    'card.open': 'Open',
    'card.code': 'View code',
    'card.github': 'on GitHub',
    'card.details': 'Details',
    'card.noDesc': 'No description yet.',
    'card.updated': 'updated',
    'status.live': 'Live',
    'status.building': 'Building',
    'status.archived': 'Archived',
    'type.game': 'Game',
    'type.app': 'App',
    'type.tool': 'Tool',
    'modal.close': 'Close',
    'modal.readme': 'From the README',
    'modal.stack': 'Tech stack',
    'modal.facts': 'Facts',
    'modal.created': 'Created',
    'modal.updated': 'Last update',
    'modal.commits': 'Commits',
    'modal.stars': 'Stars',
    'modal.noReadme': 'This project doesn’t have a README yet.',
    'about.title': 'About',
    'about.p1': 'I’m 17, an IT apprentice in Switzerland, doing the vocational baccalaureate on the side.',
    'about.p2': 'Evenings and weekends I build games and apps, mostly for the browser. The goal: projects people actually use. And one day, making a living from them.',
    'about.p3': 'Otherwise: volleyball, the gym, cybersecurity, Valorant.',
    'about.lead': 'IT apprentice, 17. I build things you can open in a browser and use right away.',
    'about.latest': 'last worked on',
    'contact.github': 'Code, issues and updates',
    'contact.title': 'Contact',
    'contact.lead': 'Feedback on a game, a bug or an idea? Write to me.',
    'contact.mail': 'Send an email',
    'footer.built': 'Built with Vite, React and GSAP. Data from the GitHub API.',
    'footer.egg': 'Hint: ↑ ↑ ↓ ↓ ← → ← → B A',
    'time.now': 'just now',
    'data.fallback': 'Live data loaded straight from GitHub.',
    'data.error': 'Projects couldn’t be loaded. Reload the page or check GitHub directly.',
  },
} as const;

export type Key = keyof (typeof dict)['de'];

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: Key) => string;
}
const I18n = createContext<Ctx>(null!);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const s = localStorage.getItem('pm-lang');
      if (s === 'de' || s === 'en') return s;
    } catch {
      /* Storage blockiert */
    }
    return 'de';
  });
  useEffect(() => {
    document.documentElement.lang = lang;
    try {
      localStorage.setItem('pm-lang', lang);
    } catch {
      /* egal */
    }
  }, [lang]);
  const value = useMemo<Ctx>(() => ({ lang, setLang, t: (k) => dict[lang][k] ?? k }), [lang]);
  return <I18n.Provider value={value}>{children}</I18n.Provider>;
}

export const useI18n = () => useContext(I18n);

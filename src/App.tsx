import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import BootIntro from './components/BootIntro';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Stats from './components/Stats';
import Projects from './components/Projects';
import About from './components/About';
import Contact from './components/Contact';
import Footer from './components/Footer';
import { loadRepoData } from './lib/data';
import { initSmoothScroll, ScrollTrigger } from './lib/scroll';
import { prefersReducedMotion } from './lib/motion';
import { useKonami } from './lib/useKonami';
import type { Project, RepoData } from './types';

// Code-Splitting: Modal und Easter Egg werden erst bei Bedarf geladen.
const ProjectModal = lazy(() => import('./components/ProjectModal'));
const MatrixRain = lazy(() => import('./components/MatrixRain'));

const BOOT_KEY = 'pm-booted';

export default function App() {
  const [data, setData] = useState<RepoData | null>(null);
  const [error, setError] = useState(false);
  const [booted, setBooted] = useState(() => {
    if (prefersReducedMotion()) return true;
    try {
      return sessionStorage.getItem(BOOT_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [open, setOpen] = useState<Project | null>(null);
  const [matrix, setMatrix] = useState(false);
  const reduced = prefersReducedMotion();

  useEffect(() => {
    loadRepoData()
      .then(setData)
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    if (reduced) document.documentElement.classList.add('reduced');
    initSmoothScroll();
  }, [reduced]);

  // Nach Datenwechsel Layout-Positionen der ScrollTrigger neu berechnen
  useEffect(() => {
    const id = window.setTimeout(() => ScrollTrigger.refresh(), 120);
    return () => window.clearTimeout(id);
  }, [data, booted]);

  // Deep-Link: #projekt/<name> öffnet direkt die Detailansicht
  useEffect(() => {
    if (!data) return;
    const sync = () => {
      const m = location.hash.match(/^#projekt\/(.+)$/);
      const p = m ? data.projects.find((x) => x.name === decodeURIComponent(m[1])) : null;
      setOpen(p ?? null);
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, [data]);

  const openProject = useCallback((p: Project) => {
    history.replaceState(null, '', `#projekt/${encodeURIComponent(p.name)}`);
    setOpen(p);
  }, []);
  const closeProject = useCallback(() => {
    history.replaceState(null, '', location.pathname + location.search);
    setOpen(null);
  }, []);

  const finishBoot = useCallback(() => {
    try {
      sessionStorage.setItem(BOOT_KEY, '1');
    } catch {
      /* egal */
    }
    setBooted(true);
  }, []);

  const triggerEgg = useCallback(() => setMatrix(true), []);
  useKonami(triggerEgg);

  return (
    <>
      <a href="#main" className="skip-link">
        Zum Inhalt springen / Skip to content
      </a>

      {/* Atmosphäre */}
      <div className="atmo atmo-grid" aria-hidden="true" />
      <div className="atmo atmo-scan" aria-hidden="true" />
      <div className="atmo atmo-noise" aria-hidden="true" />

      {!booted && <BootIntro repoCount={data?.projects.length ?? null} onDone={finishBoot} />}

      <Nav onLogoEgg={triggerEgg} />

      <main id="main" className="relative z-10">
        <Hero data={data} started={booted} />
        <Stats data={data} />
        <Projects data={data} error={error} onOpen={openProject} />
        <About data={data} />
        <Contact />
      </main>
      <Footer data={data} />

      <Suspense fallback={null}>
        {open && <ProjectModal project={open} onClose={closeProject} />}
        {matrix && <MatrixRain onDone={() => setMatrix(false)} />}
      </Suspense>
    </>
  );
}

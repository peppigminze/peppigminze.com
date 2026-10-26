import { useI18n } from '../i18n';
import { formatDate } from '../lib/time';
import type { RepoData } from '../types';
import { LeafLogo } from './Icons';

export default function Footer({ data }: { data: RepoData | null }) {
  const { t, lang } = useI18n();
  return (
    <footer className="relative z-10 border-t border-[var(--line)]">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-5 py-10 sm:px-8 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <LeafLogo className="h-5 w-5" />
          <span className="mono text-[12px] text-ink-muted">© {new Date().getFullYear()} peppigminze</span>
        </div>
        <p className="mono text-[11.5px] text-ink-faint">{t('footer.built')}</p>
        <p className="mono text-[11.5px] text-ink-faint">
          {data ? `build ${formatDate(data.generatedAt, lang)}` : ''}
          <span className="ml-3 hidden text-ink-faint/70 sm:inline" title="Easter Egg">
            {t('footer.egg')}
          </span>
        </p>
      </div>
    </footer>
  );
}

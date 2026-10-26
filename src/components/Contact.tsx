import { useI18n } from '../i18n';
import { SITE } from '../site';
import { GitHubIcon } from './Icons';

export default function Contact() {
  const { t } = useI18n();
  return (
    <section id="kontakt" className="relative z-10 mx-auto max-w-[1400px] px-5 pb-24 sm:px-8 md:pb-32" aria-labelledby="contact-title">
      <div className="glass hud relative overflow-hidden rounded-3xl px-6 py-14 sm:px-12 md:py-20">
        {/* dezenter Minz-Schimmer */}
        <div
          className="pointer-events-none absolute -right-40 -top-40 h-[480px] w-[480px] rounded-full opacity-40 blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(61,255,181,.35), transparent 60%)' }}
          aria-hidden="true"
        />
        <h2 id="contact-title" className="h-section relative">
          {t('contact.title')}
        </h2>
        <p className="lead relative mt-4">{t('contact.lead')}</p>

        <a
          href={`mailto:${SITE.email}`}
          className="group relative mt-10 inline-block max-w-full break-all font-display text-[clamp(1.6rem,0.8rem+4vw,4.2rem)] font-semibold leading-none tracking-[-0.04em] text-ink transition-colors hover:text-mint"
          aria-label={`${t('contact.mail')}: ${SITE.email}`}
        >
          {SITE.email}
          <span className="absolute -bottom-2 left-0 h-[2px] w-full origin-left scale-x-0 bg-mint shadow-[0_0_12px_#3DFFB5] transition-transform duration-500 ease-[cubic-bezier(.16,1,.3,1)] group-hover:scale-x-100" />
        </a>

        <ul className="relative mt-12 flex flex-wrap gap-3">
          {SITE.socials.map((s) => (
            <li key={s.href}>
              <a href={s.href} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                <GitHubIcon /> {s.handle}
                <span className="hidden text-ink-faint sm:inline">{t('contact.github')}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

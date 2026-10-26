/** Zentrale Seiten-Einstellungen. Hier Socials / Mail anpassen. */
export const SITE = {
  name: 'peppigminze',
  domain: 'peppigminze.com',
  github: 'https://github.com/peppigminze',
  githubUser: 'peppigminze',
  // ANNAHME: Adresse muss ggf. noch eingerichtet werden (z. B. Cloudflare Email Routing).
  email: 'kontakt@peppigminze.com',
  socials: [
    { label: 'GitHub', href: 'https://github.com/peppigminze', handle: '@peppigminze' },
  ] as { label: string; href: string; handle: string }[],
};

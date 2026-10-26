# peppigminze.com · Mission Control

Hub-Seite für alle Spiele und Apps von [@peppigminze](https://github.com/peppigminze).
Listet automatisch alle öffentlichen Repos, zeigt eine Vorschau pro Projekt und verlinkt auf die Live-Version.

**Stack:** Vite · React 18 · TypeScript · Tailwind CSS · GSAP + ScrollTrigger · Lenis (Smooth Scroll) · Canvas 2D

Warum kein Three.js? Der Hero-Hintergrund (Partikelnetz + Radar) läuft in Canvas 2D. Das spart ca. 150 kB, startet sofort und läuft auch auf schwächeren Handys stabil. WebGL hätte hier optisch kaum mehr gebracht.

---

## Schnellstart

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # Produktions-Build nach dist/
npm run preview      # Build lokal ansehen
```

Repo-Daten lokal aktualisieren (optional):

```bash
GH_TOKEN=dein_token npm run data     # schreibt public/data/repos.json
npm run screenshots                   # Screenshots der Live-Projekte (braucht: npx playwright install chromium)
npm run assets                        # Favicons, OG-Bild, sitemap.xml neu erzeugen
```

Ohne Token funktioniert `npm run data` auch, aber nur mit 60 API-Anfragen pro Stunde.

---

## Wie die Daten fließen

```
GitHub Action (Push / alle 6 h / manuell)
  └─ scripts/fetch-repos.mjs      → GitHub API mit Token (serverseitig!)
       • alle öffentlichen Repos, ohne Forks und ohne dieses Hub-Repo
       • Sprachen, Commit-Anzahl, README-Auszug
       • Vorschaubild aus dem Repo (preview.png, assets/cover.*, og-image.* …) → WebP
       • Live-Check: <repo>.peppigminze.com → Homepage-Feld → <user>.github.io/<repo>/
  └─ scripts/screenshots.mjs      → Playwright fotografiert Live-Projekte ohne eigenes Bild
  └─ vite build                    → statische Seite inkl. data/repos.json + previews/*.webp
  └─ deploy-pages                  → GitHub Pages
```

Der Browser lädt nur die statische `data/repos.json`. **Kein Token im Frontend, keiner im Repo.**
Falls die Datei fehlt, holt die Seite die Repos direkt über die öffentliche GitHub-API (ohne Token).

**Status-Badges:**
- `LIVE`: Eine der URLs hat im Build geantwortet.
- `BUILDING`: Es gibt noch keine erreichbare Web-Version.
- `ARCHIVED`: Das Repo ist auf GitHub archiviert.

**Vorschau-Priorität:**
1. `preview` in der Config
2. Bild im Repo
3. Screenshot der Live-Seite
4. Generative Animation (aus dem Repo-Namen berechnet, jedes Projekt hat eigene Farbe und Muster)

Tipp: Lege in einem Projekt-Repo eine `preview.png` (z. B. 1600×1000) ab, dann wird diese statt des Screenshots benutzt.

---

## Karten anpassen: `projects.config.json`

Schlüssel ist der **exakte Repo-Name**. Alle Felder sind optional.

| Feld | Beispiel | Wirkung |
|---|---|---|
| `title` | `"BLACKOUT"` | Anzeigename |
| `description` | `"Text"` oder `{ "de": "…", "en": "…" }` | überschreibt GitHub-Beschreibung (sonst: GitHub → README-Anfang) |
| `type` | `"game"` / `"app"` / `"tool"` | Filter-Kategorie (sonst aus Topics: `game`, `tool`, `bot`…) |
| `featured` | `true` | große Bento-Karte oben (max. 3, sortiert nach `order`) |
| `order` | `1` | Reihenfolge der Featured-Karten |
| `subdomain` | `"rotationpro"` oder `false` | eigene Subdomain; `false` = kein Web-Build (zeigt „Code ansehen“) |
| `url` | `"https://…"` | feste Live-URL, überschreibt alles |
| `preview` | `"/previews/eigenes.webp"` | eigenes Vorschaubild (Datei in `public/previews/`) |
| `status` | `"live"` | Status erzwingen |
| `hidden` | `true` | Repo komplett ausblenden |

In `settings` stehen `user`, `domain`, `excludeForks` und `exclude` (Liste ausgeschlossener Repos).

Nach einer Änderung: committen und pushen. Die Action baut neu.

---

## Deployment (GitHub Pages)

### 1. Pages aktivieren

**Settings → Pages → Source: „GitHub Actions“**, dann bei Custom domain `peppigminze.com` eintragen.
Oder per Script: `GH_TOKEN=xxx ./scripts/setup-pages.sh`.

### 2. Secret (optional, empfohlen)

**Settings → Secrets and variables → Actions → New repository secret**
- Name: `GH_TOKEN`
- Wert: ein *Fine-grained Token* mit **nur Lesezugriff** auf öffentliche Repos. Unter Repository access „Public repositories (read-only)“ wählen, keine weiteren Rechte.

Ohne Secret nimmt der Workflow automatisch den eingebauten Actions-Token. Der reicht für öffentliche Repos.

### 3. Workflow starten

Push auf `main`, oder **Actions → Update & Deploy → Run workflow**.

---

## DNS-Einstellungen

Beim Domain-Anbieter (z. B. Cloudflare, Infomaniak, Hostpoint):

**Apex `peppigminze.com` → GitHub Pages**

| Typ | Name | Wert |
|---|---|---|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| AAAA | `@` | `2606:50c0:8000::153` |
| AAAA | `@` | `2606:50c0:8001::153` |
| AAAA | `@` | `2606:50c0:8002::153` |
| AAAA | `@` | `2606:50c0:8003::153` |
| CNAME | `www` | `peppigminze.github.io` |

**Subdomains für die Projekte** (`<repo>.peppigminze.com`)

Empfohlen: **pro Projekt ein eigener CNAME-Eintrag**:

| Typ | Name | Wert |
|---|---|---|
| CNAME | `rotationpro` | `peppigminze.github.io` |
| CNAME | `blackout` | `peppigminze.github.io` |
| … | … | … |

Danach im jeweiligen Projekt-Repo unter **Settings → Pages → Custom domain** z. B. `blackout.peppigminze.com` eintragen.

**Wildcard (`* CNAME peppigminze.github.io`) geht technisch, GitHub rät aber davon ab.** Jeder könnte sonst eine beliebige Subdomain von dir für sein eigenes Pages-Repo beanspruchen (Subdomain-Takeover). Wenn du trotzdem Wildcard nutzt, verifiziere die Domain unbedingt: **GitHub → Profil-Settings → Pages → Add a domain** (TXT-Record). Das ist auch ohne Wildcard empfehlenswert.

**Wichtig für Vite-Projekte:** Wenn ein Projekt mit `base: '/repo-name/'` gebaut ist, muss es auf der eigenen Subdomain auf `base: '/'` umgestellt werden, sonst laden die Assets nicht.

**Cloudflare:** Die Einträge zuerst auf „DNS only“ (graue Wolke) setzen, bis GitHub das HTTPS-Zertifikat ausgestellt hat. Danach in Pages „Enforce HTTPS“ aktivieren.

Bis eine Subdomain existiert, verlinkt die Hub-Seite automatisch auf `peppigminze.github.io/<repo>/`. Sobald die Subdomain antwortet, wechselt der Link beim nächsten Build von selbst.

---

## Alternative: Cloudflare Pages

Build command `node scripts/fetch-repos.mjs && npm run build`, Output `dist`, Umgebungsvariable `GH_TOKEN` als *Secret*.
Für die 6-h-Aktualisierung einen Deploy-Hook anlegen und per GitHub-Action-Cron aufrufen.

---

## Projektstruktur

```
├─ .github/workflows/update.yml   CI: Daten holen, Screenshots, Build, Deploy
├─ projects.config.json           Overrides pro Karte
├─ public/
│  ├─ data/repos.json             generiert (Startwert im Repo)
│  ├─ previews/*.webp             generiert
│  ├─ CNAME, robots.txt, sitemap.xml, og-image.png, Favicons
├─ scripts/
│  ├─ fetch-repos.mjs             GitHub API → repos.json
│  ├─ screenshots.mjs             Playwright-Screenshots
│  ├─ make-assets.mjs             Favicons, OG-Bild, Sitemap
│  └─ setup-pages.sh              Pages + Custom Domain per API
├─ shared/merge.js                Repo + Config → Projekt (Build & Browser)
└─ src/
   ├─ App.tsx                     Layout, Daten, Modal, Easter Egg
   ├─ i18n.tsx                    alle Texte DE/EN
   ├─ site.ts                     E-Mail, Socials
   ├─ index.css                   Design-Tokens, Glass, HUD, Karten, Cursor
   ├─ lib/                        Daten, Scroll (Lenis+GSAP), Hash, Zeit, Motion-Checks
   └─ components/                 BootIntro, Hero(+Canvas), Stats, Projects, ProjectCard,
                                  GenerativePreview, ProjectModal, About, Contact, Cursor, MatrixRain …
```

## Barrierefreiheit & Performance

- `prefers-reduced-motion`: kein Intro, kein Smooth Scroll, statische Canvas-Frames, keine Glitches.
- Touch-Geräte: kein Custom Cursor, kein Tilt, weniger Partikel, niedrigere Canvas-Auflösung.
- Canvas-Animationen pausieren außerhalb des Viewports und in Hintergrund-Tabs.
- Generative Vorschauen animieren nur bei Hover bzw. im Modal.
- Tastatur: Skip-Link, sichtbare Fokus-Ringe, Modal mit Fokusfalle und Esc.
- Bilder: WebP, `loading="lazy"`, feste Maße (kein Layout-Shift). Modal und Easter Egg sind eigene Chunks.
- Schriften: lokal gebündelt (kein Google-Fonts-Request, gut für den Datenschutz).

## Easter Egg

↑ ↑ ↓ ↓ ← → ← → B A, oder 3× schnell aufs Logo klicken.

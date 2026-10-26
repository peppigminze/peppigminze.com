# Workflow aktivieren (einmalig, 1 Minute)

GitHub lässt Workflow-Dateien nur mit einem Token pushen, der die Berechtigung **Workflows** hat.
Deshalb liegt `update.yml` vorerst hier. So aktivierst du ihn:

1. Auf GitHub im Repo: **Add file → Create new file**
2. Dateiname: `.github/workflows/update.yml`
3. Inhalt von [`setup/update.yml`](./update.yml) hineinkopieren, **Commit**
4. **Settings → Pages → Source** auf **„GitHub Actions“** umstellen

Ab dann baut der Workflow bei jedem Push und alle 6 Stunden neu (frische Repo-Daten, Live-Status, Screenshots).
Bis dahin läuft die Seite aus dem Branch `gh-pages` (statischer Build).

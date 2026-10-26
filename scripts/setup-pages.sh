#!/usr/bin/env bash
# Einmalig: GitHub Pages (Quelle "GitHub Actions") aktivieren und Custom Domain setzen.
# Nutzung:  GH_TOKEN=xxx ./scripts/setup-pages.sh
# Token braucht für dieses Repo: Administration (read/write) + Pages (read/write).
set -euo pipefail
REPO="${REPO:-peppigminze/peppigminze.com}"
DOMAIN="${DOMAIN:-peppigminze.com}"
API="https://api.github.com/repos/$REPO/pages"
H=(-H "Authorization: Bearer $GH_TOKEN" -H "Accept: application/vnd.github+json" -H "X-GitHub-Api-Version: 2022-11-28")

echo "→ Pages aktivieren (build_type=workflow)"
curl -fsS -X POST "${H[@]}" "$API" -d '{"build_type":"workflow"}' >/dev/null || echo "  (existiert evtl. schon)"
echo "→ Custom Domain $DOMAIN setzen"
curl -fsS -X PUT "${H[@]}" "$API" -d "{\"cname\":\"$DOMAIN\",\"build_type\":\"workflow\"}" >/dev/null
echo "→ Status:"
curl -fsS "${H[@]}" "$API"
echo
echo "HTTPS erzwingen geht erst, wenn das Zertifikat da ist (DNS muss stimmen):"
echo "  curl -X PUT ${H[*]} $API -d '{\"https_enforced\":true}'"

#!/usr/bin/env bash
set -euo pipefail

REPO="ivano82ff/hello-bot"
PAGES_URL="https://ivano82ff.github.io/hello-bot/planning/"

if ! gh auth status -h github.com >/dev/null 2>&1; then
  if [[ -n "${GH_TOKEN:-}" ]]; then
    echo "$GH_TOKEN" | gh auth login -h github.com --with-token
  else
    echo "GitHub auth required. Run: gh auth login -h github.com -p https --web"
    echo "Or set GH_TOKEN (repo + workflow scopes) and re-run this script."
    exit 1
  fi
fi

if ! gh repo view "$REPO" >/dev/null 2>&1; then
  gh repo create "$REPO" --private --description "hello-bot: game + student planning app"
fi

git remote get-url github >/dev/null 2>&1 || git remote add github "https://github.com/${REPO}.git"

git push github main
npm run build:pages
npx gh-pages@6.2.0 -d dist --dotfiles -r "https://github.com/${REPO}.git" -m "Deploy planning app"

# Prefer GitHub Actions source (workflow on main)
gh api "repos/${REPO}/pages" -X POST \
  -f build_type=workflow \
  -f source[branch]=main \
  -f source[path]=/ 2>/dev/null || \
gh api "repos/${REPO}/pages" -X PUT \
  -f build_type=legacy \
  -f source[branch]=gh-pages \
  -f source[path]=/

echo "Waiting for Pages…"
for _ in $(seq 1 30); do
  code="$(curl -s -o /dev/null -w '%{http_code}' "$PAGES_URL")"
  if [[ "$code" == "200" ]]; then
    echo "Live: $PAGES_URL"
    exit 0
  fi
  sleep 10
done

echo "Pages not ready yet (last HTTP $code). Check: https://github.com/${REPO}/actions"
echo "Expected URL: $PAGES_URL"

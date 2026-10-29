#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

git pull

if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

npm run build

if [[ ! -f dist/index.html ]]; then
  echo "Build failed: dist/index.html not found" >&2
  exit 1
fi

# Shared hosting: document root is this folder — publish dist/ into it.
cp -a dist/. .

echo "Built and deployed from dist/ (index.html, .htaccess, assets)."

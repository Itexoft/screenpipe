#!/bin/sh
for f in $(find . -name package.json -not -path "*/node_modules/*"); do
  d=$(dirname "$f")
  echo "$d"
  (cd "$d" && npm install --no-save --no-package-lock --legacy-peer-deps >/dev/null 2>&1 || true)
done

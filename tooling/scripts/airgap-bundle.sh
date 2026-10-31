#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUT="${1:-$ROOT/dist/modelark-source-bundle.tar.gz}"
mkdir -p "$(dirname "$OUT")"
tar -czf "$OUT" -C "$ROOT" --exclude=node_modules --exclude=.git --exclude=dist .
echo "Created source bundle: $OUT"

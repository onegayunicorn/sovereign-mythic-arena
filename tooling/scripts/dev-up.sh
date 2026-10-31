#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.."
docker compose -f infra/compose/sovereign.yml up -d
echo "Local dependencies started. Egress remains denied by the compose network."

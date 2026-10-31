#!/usr/bin/env bash
cd "$(dirname "$0")/../.." && exec docker compose -f infra/compose/arena-local.yml up --build

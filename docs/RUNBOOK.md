# Local operations runbook

1. Copy `.env.example` to `.env` and replace local development credentials.
2. Start infrastructure with `pnpm stack:up`.
3. Start applications with `pnpm dev`.
4. For disconnected release preparation, vendor approved package stores and images, generate an SBOM, sign artifacts on an operator-controlled key service, then validate in an isolated environment.
5. Restore-test Postgres and object-store backups before accepting production traffic.

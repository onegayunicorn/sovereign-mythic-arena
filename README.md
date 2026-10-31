# Sovereign AI × Mythics → Physics Battle Royal

A public, local-first **prototype monorepo** combining the ModelArk sovereign-stack scaffold, a Paean mythic-to-physics evaluation concept, a small FastAPI blueprint endpoint, a synthetic status PWA, and a playable client-only battle demo. The key boundary is deliberate: **the included scores and system telemetry are illustrative; no real model inference, physics harness, cryptographic verification, or production sovereign service is implemented here.**

- **Live demo:** [Sovereign Mythic Arena on GitHub Pages](https://onegayunicorn.github.io/sovereign-mythic-arena/)
- **PWA mock dashboard:** [Open ModelArk demo](https://onegayunicorn.github.io/sovereign-mythic-arena/modelark/)
- **Full specification summary:** [docs/REFERENCE-BLUEPRINT.md](docs/REFERENCE-BLUEPRINT.md)
- **Archive findings and omissions:** [docs/SOURCE-AUDIT.md](docs/SOURCE-AUDIT.md)
- **Implementation limits:** [docs/IMPLEMENTATION-STATUS.md](docs/IMPLEMENTATION-STATUS.md)

## What is implemented

| Area | Included behavior | Status / boundary |
|---|---|---|
| Arena tallyboard | Six named contenders, seeded demo bouts, five-axis scorecards, localStorage demo ledger | Front-end demo only; synthetic scores, illustrative gate badges, non-cryptographic FNV display hashes |
| ModelArk PWA | Responsive local UI and synthetic service/evidence snapshots | UI prototype; it does not monitor real services or device sensors |
| Blueprint API | `GET /health` and sorted `GET /api/blueprint` in FastAPI | In-memory seven-node starter response; not the battle API |
| Shared contracts / policies | Small TypeScript contract and default-deny Rego examples | Starter snippets; not production-complete libraries |
| Infrastructure | Example Compose, Kubernetes and air-gap structure | Blueprint placeholders; no end-to-end deployment or production security evidence |

The five demo axes use weights of **20 / 25 / 25 / 15 / 15** (mythic coherence, mathematics, physics, reproducibility, craft). The current UI calculates a weighted arithmetic total. This is not the same as a validated geometric-mean rubric, and no score is a measured model result. Demo bouts stay clearly marked as demo data.

## Quick start

### Requirements

- Node.js 20.11 or newer and pnpm 9.15 (use Corepack).
- Python 3.11–3.12 and Poetry for the API.
- Docker Compose only if you want the example local infrastructure profile.

### Install and run

```sh
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm install --frozen-lockfile
poetry -C apps/api install
pnpm dev
```

`pnpm dev` starts the PWA at `http://localhost:3000` and the arena demo at `http://localhost:3001`. To start the API in another terminal:

```sh
poetry -C apps/api run uvicorn modelark_api.main:app --reload --host 127.0.0.1 --port 8000
# http://127.0.0.1:8000/health
# http://127.0.0.1:8000/api/blueprint
```

Build and type-check the JavaScript workspaces, then run the demo unit tests and API test suite:

```sh
pnpm build
pnpm typecheck
pnpm test
```

To run just one frontend: `pnpm --filter @modelark/arena-tallyboard dev` or `pnpm --filter @modelark/pwa dev`. The static tallyboard can also be served with `python3 -m http.server --directory apps/arena-tallyboard 8080`.

The Compose file is an optional scaffold, not required for the included demo or blueprint endpoint:

```sh
docker compose -f infra/compose/sovereign.yml up -d
```

## Deployment

### GitHub Pages

The included Actions workflow builds the tallyboard and PWA, publishes the tallyboard at the site root, and publishes the PWA under `/modelark/` when pushed to `main`. Enable **Settings → Pages → Build and deployment → GitHub Actions** if Pages is not already enabled for the repository.

### Netlify

Build locally with `pnpm --filter @modelark/arena-tallyboard build`, then drag and drop `apps/arena-tallyboard/dist/` into Netlify Drop. To deploy the PWA separately, build with `pnpm --filter @modelark/pwa build` and deploy `apps/pwa/dist/`. No server secrets or environment variables are needed for these static demos.

## Sovereignty and privacy boundaries

The live demo is hosted publicly by GitHub Pages, so it is **not itself an air-gapped or self-hosted deployment**. The tallyboard stores demo history in the browser's localStorage; no prompt is collected or submitted. The PWA uses generated synthetic values and does not connect to a sensor, inference service, or telemetry collector. Avoid entering sensitive data. For actual sovereignty guarantees, deploy reviewed code on infrastructure you control, verify its network behavior, and implement the missing authenticated API, isolated no-egress harness, evidence pipeline, signed ledger, key custody, and backup/restore controls.

## Design reference

The supplied PDF describes a broader proposed ModelArk + Arena AI + Paean architecture. Its requirements are summarized in `docs/REFERENCE-BLUEPRINT.md`; the original PDF and saved web-page captures are intentionally not redistributed in this public repository. See `docs/SOURCE-AUDIT.md` for why.

## License

Project source is released under Apache-2.0; see [LICENSE](LICENSE). The supplied bundle's separate image/font and captured-site assets were not imported because their redistribution rights were not documented.

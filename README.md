# Sovereign AI × Mythics → Physics Battle Royal

A public, local-first **prototype monorepo** combining the ModelArk sovereign-stack scaffold, a Paean mythic-to-physics evaluation concept, a FastAPI blueprint API, a live local telemetry dashboard, and a client-side battle demo with an independent numerical physics lab. The public GitHub Pages site is static; the FastAPI backend runs separately and is not deployed there.

- **Live demo:** [Sovereign Mythic Arena on GitHub Pages](https://onegayunicorn.github.io/sovereign-mythic-arena/)
- **ModelArk dashboard:** [Open ModelArk](https://onegayunicorn.github.io/sovereign-mythic-arena/modelark/) (telemetry is unavailable on Pages because no backend is deployed)
- **Full specification summary:** [docs/REFERENCE-BLUEPRINT.md](docs/REFERENCE-BLUEPRINT.md)
- **Archive findings and omissions:** [docs/SOURCE-AUDIT.md](docs/SOURCE-AUDIT.md)
- **Implementation limits:** [docs/IMPLEMENTATION-STATUS.md](docs/IMPLEMENTATION-STATUS.md)

## What is implemented

| Area | Included behavior | Status / boundary |
|---|---|---|
| Arena tallyboard | Six named contenders, seeded demo bouts, five-axis scorecards, localStorage demo ledger, independent browser RK4 pendulum panel | Bout scores/gates remain illustrative; pendulum is a numerical ideal-model simulation, not a physical measurement or model evaluation |
| ModelArk PWA | Two-second polling for host CPU/RAM, API process uptime/RSS, response latency, local inference mode, and a short browser-session history | Shows observed values only when the local API responds; GitHub Pages has no backend and displays telemetry unavailable |
| FastAPI API | Health/blueprint routes, live host/process telemetry, bounded RK4 pendulum endpoint, inference status/generate endpoints | Inference defaults to an explicit mock; optional Ollama calls are limited to a configured loopback service; no cloud model or external API is used |
| Shared contracts / policies | Small TypeScript contract and default-deny Rego examples | Starter snippets; not production-complete libraries |
| Infrastructure | Example Compose, Kubernetes and air-gap structure | Blueprint placeholders; no end-to-end deployment or production security evidence |

The five demo axes use weights of **20 / 25 / 25 / 15 / 15** (mythic coherence, mathematics, physics, reproducibility, craft). The current UI calculates a weighted arithmetic total. This is not the same as a validated geometric-mean rubric, and no score is a measured model result. Running Chronos does not change scores, gates, standings, or the demo ledger.

## Quick start

### Requirements

- Node.js 20.11 or newer and pnpm 9.15 (use Corepack).
- Python 3.11–3.12 and Poetry for the API.
- Ollama is optional; the inference API remains in mock mode unless explicitly configured.

### Install and run

```sh
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm install --frozen-lockfile
poetry -C apps/api install
```

Start the API in one terminal:

```sh
pnpm api:dev
# API health: http://127.0.0.1:8000/health
# Dashboard data: http://127.0.0.1:8000/api/telemetry
# Inference status: http://127.0.0.1:8000/api/inference/status
```

Start the PWA and battle demo in another terminal:

```sh
pnpm dev
# ModelArk PWA: http://localhost:3000
# Battle demo:  http://localhost:3001
```

Both Vite dev servers proxy `/api` to `127.0.0.1:8000`. The PWA polls actual API-reported metrics every two seconds. The arena's browser-side RK4 simulation works without the API; its “Check local API” button compares the request with the optional backend calculation.

### Local inference

The API defaults to an explicit mock that echoes the prompt and identifies itself as mock output; it is useful for exercising endpoint behavior, not a model result. To use an Ollama service already running on the same machine, set these environment variables before starting the API:

```sh
SOVEREIGN_INFERENCE_MODE=ollama
SOVEREIGN_OLLAMA_URL=http://127.0.0.1:11434
SOVEREIGN_OLLAMA_MODEL=llama3.2
```

The adapter rejects non-loopback hosts, disables environment-proxy use and redirects, and returns an unavailable response rather than silently falling back to the mock. Install/download Ollama and a model separately if you want actual local model inference. No model is bundled with this repository.

### API routes

- `GET /health` — process health.
- `GET /api/blueprint` — starter repository map.
- `GET /api/telemetry` — sampled host/process metrics and runtime metadata.
- `POST /api/physics/pendulum` — bounded RK4 simple-pendulum trace and derived diagnostics.
- `GET /api/inference/status` — provider mode and local model availability.
- `POST /api/inference/generate` — explicit mock response by default, or optional loopback Ollama inference.

Build and type-check the JavaScript workspaces, then run the demo unit tests and API test suite:

```sh
pnpm build
pnpm typecheck
pnpm test
```

The API tests cover telemetry response shape, solver accuracy and input bounds, explicit mock mode, and rejection of remote Ollama hosts. To run one frontend: `pnpm --filter @modelark/arena-tallyboard dev` or `pnpm --filter @modelark/pwa dev`. The static tallyboard can also be served with `python3 -m http.server --directory apps/arena-tallyboard 8080`; that static server has no API proxy.

The Compose file is an optional scaffold, not required for the included demo or API:

```sh
docker compose -f infra/compose/sovereign.yml up -d
```

## Deployment

### GitHub Pages

The Actions workflow builds the tallyboard and PWA, publishes the tallyboard at the site root, and publishes the PWA under `/modelark/` when pushed to `main`. This static site does **not** deploy FastAPI, Ollama, inference workers, or telemetry services. Therefore the published PWA correctly shows telemetry unavailable unless a separately hosted backend is deliberately configured.

### Netlify

Build locally with `pnpm --filter @modelark/arena-tallyboard build`, then drag and drop `apps/arena-tallyboard/dist/` into Netlify Drop. To deploy the PWA separately, build with `pnpm --filter @modelark/pwa build` and deploy `apps/pwa/dist/`. Static hosting alone does not create an API backend.

## Sovereignty and privacy boundaries

The live demo is hosted publicly by GitHub Pages, so it is **not itself an air-gapped or self-hosted deployment**. The tallyboard stores demo history in browser localStorage; its browser simulation does not transmit user data. Local telemetry and inference are provided only by the API process you run; this repository's static hosting does not receive those readings. Avoid entering sensitive data into a publicly hosted page. For actual sovereignty guarantees, deploy reviewed code on infrastructure you control, verify its network behavior, and implement the missing authenticated API, isolated no-egress harness, evidence pipeline, signed ledger, key custody, and backup/restore controls.

## Design reference

The supplied PDF describes a broader proposed ModelArk + Arena AI + Paean architecture. Its requirements are summarized in `docs/REFERENCE-BLUEPRINT.md`; the original PDF and saved web-page captures are intentionally not redistributed in this public repository. See `docs/SOURCE-AUDIT.md` for why.

## License

Project source is released under Apache-2.0; see [LICENSE](LICENSE). The supplied bundle's separate image/font and captured-site assets were not imported because their redistribution rights were not documented.

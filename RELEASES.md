# Releases

## Unreleased — 2026-10-31

### Added

- Added the isolated Local Model Bench with loopback-only Ollama inference and explicit `local_model_output` evidence labeling.
- Packaged the RK4 pendulum physics API and built arena frontend into a multi-stage Docker image.
- Added a Docker Compose bundle with Ollama `0.40.13`, persistent model storage, automatic model bootstrap, and shared loopback networking.
- Added same-origin serving for the built tallyboard and FastAPI routes.

### Validation

- Local Ollama smoke test passed with `qwen2.5:0.5b`.
- RK4 theoretical period: `2.0064 s`; simulated period: `2.0114 s`.
- Model output remained isolated from scoring and the demo ledger; fixed scoring fixture remained `80.0`.
- Frontend build, typecheck, and the complete 13-test suite passed.

### Deployment

```sh
docker compose -f infra/compose/arena-local.yml up --build
```

Open `http://127.0.0.1:8000/` after the stack starts. Docker deployment has not been executed in this sandbox because no Docker daemon is installed.

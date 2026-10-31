# Docker packaging

The repository includes a local Docker deployment for the arena API, the built tallyboard, the RK4 physics endpoint, and the isolated Ollama model bench.

## Start the bundled stack

From the repository root:

```sh
docker compose -f infra/compose/arena-local.yml up --build
```

Open `http://127.0.0.1:8000/`. The first run downloads the configured model into the named `ollama-models` volume. The default is `qwen2.5:0.5b`; override it with `SOVEREIGN_OLLAMA_MODEL`:

```sh
SOVEREIGN_OLLAMA_MODEL=qwen2.5:0.5b docker compose -f infra/compose/arena-local.yml up --build
```

The Compose file maps the shared network namespace's ports to the host. The API container and Ollama container share one loopback namespace, so the existing API restriction to `127.0.0.1` remains active; the API is not changed to trust arbitrary container-network hosts. Ollama cloud mode is disabled.

Useful checks:

```sh
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/inference/status
curl http://127.0.0.1:8000/api/telemetry
```

Stop the stack without deleting the model cache:

```sh
docker compose -f infra/compose/arena-local.yml down
```

Delete the downloaded model volume only when it is intentionally no longer needed:

```sh
docker compose -f infra/compose/arena-local.yml down -v
```

This package is for local deployment. It does not add authentication, signed evidence, production TLS, or a public inference endpoint. Do not expose port 8000 or 11434 to an untrusted network without adding those controls.

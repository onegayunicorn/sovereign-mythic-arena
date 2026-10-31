# Architecture overview

```text
PWA / Console → API gateway → policy + auth → orchestrator → isolated workers
                                    ├→ local model-serving adapter
                                    ├→ Paean battle harness + evidence ledger
                                    └→ device/PWA event pipeline
Postgres metadata · Redis queue · NATS events · MinIO artifacts · OTel self-hosted
```

Developable domains: `apps/` user-facing and API applications; `packages/` shared contracts and libraries; `services/` long-running workers; `ml/` model registry and evaluation; `infra/` self-hosted deployments; `data/` manifests and synthetic fixtures; `docs/` operational policies. Default runtime egress is denied. External providers remain optional adapters and must be explicitly configured.

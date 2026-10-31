# Implementation status

**Overall:** prototype / specification stage. This repository is not a production release of ModelArk, an AI benchmark, or a physics-validation platform.

| Component | Present implementation | Not implemented / not evidenced |
|---|---|---|
| Arena tallyboard | Browser UI; deterministic pseudorandom bout-score jitter; browser-local seed ledger; independent ideal-pendulum RK4 solver and animation; optional API parity check | Model inference for bouts, measured artifact execution, physical experiment, blind judge ballots, API persistence, secure hash chain, or signing |
| ModelArk PWA | Polls local FastAPI for host CPU/RAM, API process uptime/RSS, latency, provider mode, and browser-session sample history; shows unavailable when API is absent | No telemetry backend is deployed to GitHub Pages; no remote service discovery, sensors, model registry, authentication, or sovereign data-plane controls |
| Blueprint API | FastAPI health/blueprint routes; psutil host/process telemetry; bounded RK4 simple-pendulum endpoint; explicit mock inference; optional Ollama adapter restricted to loopback | No database-backed hierarchy, authn/authz, migrations, production deployment, actual model bundled with the repo, or production observability. No Ollama server/model was installed for this task's verification |
| TypeScript contracts | Small starter interfaces for evidence status, artifacts, and blueprint nodes | Versioned protocol governance, schema validation/build generation, compatibility policy, and broad test coverage |
| Rego policies | One small default-deny policy example | Integrated policy enforcement, policy tests, and security review |
| Infrastructure and ML folders | Scaffolding, notes, and example manifests | A complete deployable stack, operational runbooks verified against production, preinstalled local inference model, or air-gap bundle validation |

## Result semantics

The five battle axes are illustrative and the UI currently computes a weighted arithmetic score. Seed values and demo-gate labels remain illustrative. The short brief mentions a weighted geometric mean; that calculation is **not** implemented. The demo ledger uses display-only FNV-style 32-bit hashes and browser localStorage; it is not tamper resistant.

Chronos solves an ideal simple pendulum numerically with RK4 in the browser. The API offers an independent bounded RK4 calculation for comparison. Period and energy drift are solver-derived simulation diagnostics—not physical measurements, hardware verification, or model performance. The simulation does not update bout scores, gate badges, standings, or ledger entries.

The inference endpoint defaults to an explicit mock that does not execute a model. A real local inference request is possible only if the operator separately installs/runs Ollama and enables the loopback-only adapter. No hosted provider is configured or contacted by this repository.

## Safe next implementation increments

Before publishing measured standings, implement and test a pinned no-egress artifact harness, units/dimensional and convergence tests, evidence-linked gate states, independent blind ballots with abstention, canonical manifests, proper SHA-256/signature verification with operator key custody, and a self-hosted authenticated API/ledger. If telemetry is later exposed beyond localhost, add authentication, rate limits, explicit retention controls, and a security review. Physical claims need a separately instrumented apparatus and independent measurement protocol. Keep crowd votes, Paean tournament standings, simulated outputs, and external leaderboard snapshots separate.

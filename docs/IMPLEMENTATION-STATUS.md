# Implementation status

**Overall:** prototype / specification stage. This repository is not a production release of ModelArk, an AI benchmark, or a physics-validation platform.

| Component | Present implementation | Not implemented / not evidenced |
|---|---|---|
| Arena tallyboard | Browser UI; deterministic pseudorandom score jitter; browser-local seed ledger | Model inference, measured artifact execution, validated physics, blind judge ballots, API persistence, secure hash chain, or signing |
| ModelArk PWA | React dashboard renders synthetic status snapshots on an interval and reflects browser online/offline state | Actual service discovery, metrics ingestion, sensors, model registry, authentication, or sovereign data-plane controls |
| Blueprint API | FastAPI health route plus a sorted seven-node in-memory tree | Database-backed hierarchy, battle endpoints, authentication, authorization, migrations, or production observability |
| TypeScript contracts | Small starter interfaces for evidence status, artifacts, and blueprint nodes | Versioned protocol governance, schema validation/build generation, compatibility policy, and broad test coverage |
| Rego policies | One small default-deny policy example | Integrated policy enforcement, policy tests, and security review |
| Infrastructure and ML folders | Scaffolding, notes, and example manifests | A complete deployable stack, operational runbooks verified against production, local inference, or air-gap bundle validation |

## Result semantics

The five axes are illustrative and the UI currently computes a weighted arithmetic score. Seed values and demo-gate labels are deliberately marked as illustrative. The short brief mentions a weighted geometric mean; that calculation is **not** implemented. Likewise, the PDF proposes four gates, SHA-256 canonical manifests, signatures, and an append-only verifiable ledger, but the UI currently uses display-only FNV-style 32-bit hashes and localStorage. Do not use it to claim tamper resistance or physical evidence.

## Safe next implementation increments

Before any measured standings are published, implement and test a pinned no-egress artifact harness, units/dimensional and convergence tests, evidence-linked gate states, independent blind ballots with abstention, canonical manifests, proper SHA-256/signature verification with operator key custody, and a self-hosted authoritative API/ledger. Then independently review the evidence and deployment controls. Keep crowd votes, Paean tournament standings, and external leaderboard snapshots separate.

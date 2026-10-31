# Reference blueprint: ModelArk + Arena AI + Paean

This note condenses the supplied PDF's product requirements that apply to this repository. It is a design reference, not a claim that the proposed platform is implemented or validated. The source bundle's duplicate drafts and saved-page exports are documented in [SOURCE-AUDIT.md](SOURCE-AUDIT.md).

## Product boundary

- **ModelArk** is the proposed self-hosted, air-gap-capable model-management foundation. Core operation should not require a third-party SaaS provider or send prompts, artifacts, or telemetry off-site by default.
- **Arena AI** is the proposed control plane for routing inference, running blind evaluations, scoring, and publishing scoped results.
- **Paean** is a bout-scoped contest: a contender declares a symbolic/mythic stack and turns it into a mathematical, executable, falsifiable artifact. A bout win is not an overall model ranking.
- Keep three claims distinct: a result for a named bout and rubric; standings in a named local tournament; and an external benchmark/category ranking with its own dated source.

## Proposed bout pipeline

`contender + canonical manifest → artifact and units → pinned no-network harness → four hard gates → independent blind judging → weighted five-axis scoring → signed record and hash-linked ledger → scoped standings`

The four proposed gates are: (1) clean pinned build; (2) units/dimensional tests; (3) headless, no-network execution; and (4) verifiable source, manifest, toolchain, output hashes, and provenance. A failed, unknown, or disputed gate means invalid/pending—not a pass that can be offset by a high weighted score.

The axes and suggested weights are:

| Axis | Weight | Evidence focus |
|---|---:|---|
| Mythic coherence | 20% | Consistent symbolism and traceable mapping into the system |
| Mathematics | 25% | Derivation, dimensional consistency, assumptions, numerical stability |
| Physics | 25% | Model validity, units, boundary conditions, conservation and uncertainty |
| Reproducibility | 15% | Pinned inputs/toolchain, replay, tests and provenance |
| Craft | 15% | Clarity, maintainability, instrumentation and usability |

A bout manifest should pin contender/model IDs and digests, prompt and artifact digests, rubric/harness versions, toolchain/container digests, pairing seed, and evidence references. Deterministic replay is necessary but does not establish that the physics is correct.

## Integrity and data handling

Use canonical serialization and SHA-256 for integrity hashes. Final records should be signed with managed Ed25519 keys; private keys stay in operator custody and out of browser code and workers. A hash chain detects altered records only when its roots/checkpoints are independently retained. Neither a hash nor a signature proves an experiment occurred.

Use synthetic fixtures and mock inference by default. Workers should be rootless, resource-limited, time-bounded, read-only by default, and run without network egress. Keep immutable traces in operator-controlled storage. Separate demo/seed records from measured, hardware-verified, or production-backed evidence. Missing evidence or independent reviewer disagreement should remain pending/abstain.

## Proposed operating stack

The PDF proposes a polyglot monorepo: pnpm/Turborepo and Changesets for TypeScript; Poetry for Python; typed shared contracts; FastAPI services; a web console; and self-hosted Postgres, a queue/event system, object storage, observability, and optional local inference adapters. Docker Compose, Kubernetes, air-gap bundles, backup/restore, SBOM, signatures, and staged promotion are intended deployment capabilities. Those components remain proposed until their code and emitted evidence exist.

## Evidence and release criteria

A production claim would require clean pinned builds, schema/migration and unit/contract/integration/deterministic tests, security scans, emitted hard-gate reports, independently recomputed math/physics evidence, tamper/replay checks, verified signatures, and tested backup/restore and rollback. Publish the exact verified artifact digest; preserve command output, tool versions, commit identity, checksums, and reviewer decisions. Distinguish implementation verification from scientific validation.

## First proposed falsifiable artifact

The Chronos Pendulum proposal calls for stated SI units, initial conditions, mass, length, gravity, solver and version, timestep and tolerances; comparison against the small-angle period formula `T = 2π√(L/g)`; step-refinement/convergence checks; and a raw trace with checksum. The proposed energy-drift threshold is an acceptance target only until supported by measured run output and independent review.

## Current repository status

This repository currently contains only a small in-memory blueprint API, a synthetic PWA dashboard, source snippets/contracts, and a client-only illustrative tallyboard. It does **not** implement the proposed model registry, inference workers, physics harness, judging quorum, production API, signed ledger, no-egress sandbox, or air-gap release pipeline. See [IMPLEMENTATION-STATUS.md](IMPLEMENTATION-STATUS.md).

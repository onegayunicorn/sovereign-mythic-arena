# Paean independent buddy check (design)

This module is a release/evidence gate, not a second model that merely agrees with the author. It applies to high-impact transitions: accepting a physics claim, finalizing a leaderboard result, overriding a gate, signing an artifact, publishing a result, or deploying a release.

## Gate ladder

`G0 schema + provenance -> G1 automated tests/static analysis -> G2 independent buddy review -> G3 math/physics validation -> G4 authorized signing/release`

Any missing evidence, disagreement, invalid signature, replayed nonce, failed gate, or reviewer conflict of interest yields `pending`/`abstain` or `reject`; never silently pass. Human authorization remains required for G4.

## Reverse handshake / whisper protocol

1. Build a versioned canonical evidence manifest. Include contender IDs, prompt and data digests, rubric/harness/toolchain versions, source and output digests, gate evidence references, and a fresh nonce. Exclude secrets and raw personal data.
2. Canonicalize using the project’s documented canonical JSON profile (UTF-8, stable key ordering, normalized numbers); compute SHA-256 over the manifest and evidence index.
3. The submitting service signs the digest using an operator-controlled Ed25519 key. Record algorithm and key ID; private keys stay in a KMS/HSM or offline signing station.
4. Send the digest, signature, nonce, and immutable evidence references to a separately authorized verifier over an authenticated channel.
5. The buddy independently recomputes the digest, verifies the signature and nonce, checks reviewer independence, and recomputes the required checks from the referenced inputs. It must not trust an author’s claimed pass flag.
6. Return a minimal signed “whisper” acknowledgement with the digest, nonce, verifier identity/key ID, verdict (`accept | reject | abstain`), checked-evidence IDs, disagreements, and timestamp. Do not echo prompts, secrets, or private data.
7. Verify the buddy signature and nonce, then append request and response to the tamper-evident audit ledger. Reject replayed nonces and digest/key mismatches.

A hash chain/signature establishes integrity and attribution for recorded bytes; it does **not** prove a physical experiment occurred. Physical claims require instrument provenance, raw measurements, calibration, protocol, uncertainty, and independent review.

## Reviewer independence and rubric

The buddy must be a different qualified person or independently operated verifier, not the submission author or the same model/session. Record role/qualification, conflict check, evidence reviewed, method/version, disagreements, remediation, and explicit approval/abstention. For math/physics, independently check dimensional consistency, derivations, boundary/initial conditions, numerical convergence, conservation/error bounds, uncertainty, and comparison to analytic/experimental references where available. Keep verification (implementation matches specification) distinct from validation (model represents the intended real system).

## Hugging Face evaluation adapter

Optional, self-hosted evaluation integrations may consume Hugging Face Evaluate metrics/evaluators and publish compatible `.eval_results/*.yaml` or model-card outputs. Pin dataset revision/config/split, metric and library versions, evaluator code, prompt/template, decoding settings, model digest, hardware/runtime, and raw outputs. Dataset cards must capture source, license/consent, preprocessing, PII treatment, intended use, bias, and limitations. This track scores model tasks; it is separate from Paean’s physical-artifact rubric. External Hub access is disabled in air-gap mode; vendor licensed datasets and packages with provenance.

## Evidence status vocabulary

`demo-seed`, `declared`, `measured`, `independently-reviewed`, `hardware-verified`, `production-backed`. Seed scores and hard-coded demo gates are excluded from verified standings. A buddy review is evidence of review, not a safety guarantee.

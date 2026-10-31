# Security baseline

- Default-deny egress; workers are non-root, resource-capped, time-bounded, and isolated.
- Never commit secrets, signing keys, personal data, or proprietary weights. Keep secrets in operator-controlled secret storage.
- Enforce authn/authz, tenant isolation, explicit consent, retention/deletion, and audit trails before production.
- Validate upload paths, archive contents, hashes, manifests, model licenses, and artifact provenance.
- The starter is not a compliance certification or security audit. Complete threat modeling, penetration testing, backup restore, and key-rotation exercises for each deployment.
- PWA sensor/device functionality is opt-in; demo telemetry is synthetic and stays in the browser.

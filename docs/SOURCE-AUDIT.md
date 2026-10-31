# Source archive audit

## What was supplied

The ZIP contained 455 entries (about 12.9 MB) across six top-level project groups, plus a 280-page PDF. The quick note describes a conceptual `mythic-arena` monorepo, but the archive is a collection of separate app prototypes, two duplicate ModelArk starter trees, a small Next.js template, saved HTML/MHTML website captures, and design/specification material—not one ready-to-run monorepo.

## Selected source of truth

- The `modelark-sovereign-complete-blueprint/modelark-sovereign-starter` tree was selected as the fuller of the two starter copies. It adds Paean demo-boundary, buddy-check, and optional evaluation documentation absent from the devkit copy.
- The standalone `mythic-stack-battle-royal` client app was retained as `apps/arena-tallyboard` because it is the clearest runnable expression of the supplied title and works without a backend.
- The starter's PWA and minimal FastAPI blueprint API were retained.
- The unrelated Next.js template was excluded; it was a generic database starter with an unrelated package name and no implementation of the requested arena workflow.

## Issues corrected for this release

- The root pnpm lock was only a tiny placeholder and did not describe the workspace's actual dependencies. A real lockfile is generated for the selected workspace.
- The PWA manifest named React, Vite, TypeScript, and the React plugin in source imports but did not declare them. These dependencies and a typecheck command are declared now.
- The API has its own Poetry project; the archive's root Poetry lock was a placeholder and duplicated that project. The invalid root Python metadata was removed, and the API dependency lock is generated independently.
- The static arena page referenced Google Fonts, which would make an otherwise local-only demo fetch remote assets. That reference was removed; system font fallbacks are used.
- The arena footer described API routes and hash-chain verification that the client-only demo does not provide. It now states the actual localStorage/demo boundary.
- The PWA build is configured for a subpath deployment. The site and PWA are built locally before the GitHub Pages workflow uploads them.
- The scaffold's license file was only a notice pointing to Apache-2.0 and explicitly asked for the full license. The full Apache-2.0 text is included in this repository.

## Intentionally not redistributed

- The raw PDF: its extracted text includes generated planning/draft material and tangential content beyond this product brief. Relevant product requirements are summarized in [REFERENCE-BLUEPRINT.md](REFERENCE-BLUEPRINT.md), rather than publishing the raw draft.
- Saved `.mht`/`.mhtml` pages, captured megabyte-scale rendered HTML, download metadata, and duplicated downloaded font files. These are archival captures, not source, and include third-party page content and external asset references.
- The two contender-specific visual React variants and their local image/font assets. The supplied bundle had no explicit redistribution licenses for those assets; they can be reconsidered once asset rights/provenance are documented.
- The duplicate older ModelArk devkit tree. Its non-duplicated useful Paean notes were already present in the selected complete blueprint.

## Security and provenance limits

A source/config scan did not find an obvious API key or private key in the retained tree. The sample `.env.example` contains local placeholder service URLs only. This is a bounded review of the files selected for release, not a forensic or security certification. No original asset licensing metadata was present for the excluded visual captures. Do not treat the synthetic scores or “demo” gate badges as empirical evidence.

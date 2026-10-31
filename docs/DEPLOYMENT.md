# Deployment

## GitHub Pages

The workflow in `.github/workflows/pages.yml` builds the static tallyboard at the repository root and places the ModelArk PWA at `/modelark/`. On pushes to `main`, it uploads the assembled site and deploys it with GitHub Pages. Enable the repository's Pages source as **GitHub Actions** under Settings → Pages when the first deployment is not automatically enabled. The site is static: it does not deploy the FastAPI service, Compose stack, inference workers, or private data-plane components.

## Netlify static demo

```sh
pnpm install --frozen-lockfile
pnpm --filter @modelark/arena-tallyboard build
```

Drag `apps/arena-tallyboard/dist/` into Netlify Drop. To publish the synthetic PWA dashboard separately, run `pnpm --filter @modelark/pwa build` and deploy `apps/pwa/dist/`. No site secret is required. These public static hosting choices are convenient demos, not sovereign/air-gapped production deployments.

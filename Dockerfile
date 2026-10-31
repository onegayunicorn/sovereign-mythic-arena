FROM node:22-bookworm-slim AS frontend-build

WORKDIR /src
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/arena-tallyboard/package.json apps/arena-tallyboard/package.json
COPY apps/arena-tallyboard ./apps/arena-tallyboard
COPY packages ./packages
COPY apps/pwa/package.json apps/pwa/package.json

RUN corepack enable \
    && pnpm install --frozen-lockfile \
    && pnpm --filter @modelark/arena-tallyboard build

FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    SOVEREIGN_INFERENCE_MODE=ollama \
    SOVEREIGN_OLLAMA_URL=http://127.0.0.1:11434 \
    SOVEREIGN_OLLAMA_MODEL=qwen2.5:0.5b

WORKDIR /app

COPY apps/api/pyproject.toml apps/api/poetry.lock ./
COPY apps/api/modelark_api ./modelark_api
RUN pip install --no-cache-dir .

COPY --from=frontend-build /src/apps/arena-tallyboard/dist ./static

EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=6 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=2)"

CMD ["uvicorn", "modelark_api.main:app", "--host", "0.0.0.0", "--port", "8000"]

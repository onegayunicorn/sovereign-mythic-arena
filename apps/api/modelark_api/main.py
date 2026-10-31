from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from modelark_api.blueprint import router as blueprint_router

app = FastAPI(title="ModelArk Sovereign API", version="0.1.0")
app.include_router(blueprint_router, prefix="/api")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mode": "local-first"}


STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
if STATIC_DIR.is_dir():
    app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="arena")

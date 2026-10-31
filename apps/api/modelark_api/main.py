from fastapi import FastAPI
from modelark_api.blueprint import router as blueprint_router

app = FastAPI(title="ModelArk Sovereign API", version="0.1.0")
app.include_router(blueprint_router, prefix="/api")

@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "mode": "local-first"}

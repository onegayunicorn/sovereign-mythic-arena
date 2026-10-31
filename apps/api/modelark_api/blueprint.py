from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()
class BlueprintNode(BaseModel):
    path: str
    name: str
    type: str
    parentPath: str | None
    description: str
    sort: int
    language: str | None = None
    content: str | None = None

SEED = [
    BlueprintNode(path="modelark", name="modelark", type="directory", parentPath=None, description="Sovereign AI monorepo root", sort=0),
    BlueprintNode(path="modelark/apps", name="apps", type="directory", parentPath="modelark", description="Deployable applications", sort=10),
    BlueprintNode(path="modelark/apps/pwa", name="pwa", type="directory", parentPath="modelark/apps", description="Offline-capable PWA dashboard", sort=11),
    BlueprintNode(path="modelark/packages", name="packages", type="directory", parentPath="modelark", description="Shared contracts and libraries", sort=20),
    BlueprintNode(path="modelark/ml", name="ml", type="directory", parentPath="modelark", description="Model registry, evaluation, and serving", sort=30),
    BlueprintNode(path="modelark/paean", name="paean", type="directory", parentPath="modelark", description="Reproducible mythic-to-physics battle workflow", sort=40),
    BlueprintNode(path="modelark/infra", name="infra", type="directory", parentPath="modelark", description="Self-hosted and air-gap deployment", sort=50),
]

@router.get("/blueprint", response_model=list[BlueprintNode])
def get_blueprint() -> list[BlueprintNode]:
    # Starter returns the complete in-memory tree; replace with a unique-path DB repository.
    return sorted(SEED, key=lambda n: (n.sort, n.path))

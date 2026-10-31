from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel, ConfigDict, Field

from modelark_api.capabilities import (
    generate_inference,
    host_process_telemetry,
    inference_status,
    simulate_pendulum,
)

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


class PendulumRequest(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)

    length_m: float = Field(gt=0.01, le=100.0)
    mass_kg: float = Field(gt=0.001, le=1_000_000.0)
    initial_angle_rad: float = Field(ge=-6.283185307179586, le=6.283185307179586)
    initial_angular_velocity_rad_s: float = Field(ge=-100.0, le=100.0)
    gravity_m_s2: float = Field(gt=0.01, le=100.0)
    duration_s: float = Field(gt=0.0, le=3600.0)
    dt_s: float = Field(gt=0.0, le=1.0)


class InferenceRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    prompt: str = Field(min_length=1, max_length=4_000)


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


@router.get("/telemetry")
def get_telemetry() -> dict[str, Any]:
    return host_process_telemetry()


@router.post("/physics/pendulum")
def post_pendulum(request: PendulumRequest) -> dict[str, Any]:
    return simulate_pendulum(request.model_dump())


@router.get("/inference/status")
def get_inference_status() -> dict[str, Any]:
    return inference_status()


@router.post("/inference/generate")
def post_inference(request: InferenceRequest) -> dict[str, Any]:
    return generate_inference(request.prompt)

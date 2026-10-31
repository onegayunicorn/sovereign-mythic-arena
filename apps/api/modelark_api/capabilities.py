from __future__ import annotations

import math
import os
import platform
import time
from datetime import datetime, timezone
from ipaddress import ip_address
from typing import Any
from urllib.parse import urlsplit

import httpx
import psutil
from fastapi import HTTPException

_PROCESS = psutil.Process()
_PROCESS_STARTED = _PROCESS.create_time()
MAX_TRACE_POINTS = 1_001


def host_process_telemetry() -> dict[str, Any]:
    memory = psutil.virtual_memory()
    try:
        load_1m = float(os.getloadavg()[0])
    except (AttributeError, OSError):
        load_1m = 0.0
    return {
        "status": "live",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "host": {
            "cpu_percent": float(psutil.cpu_percent(interval=None)),
            "memory_percent": float(memory.percent),
            "memory_used_bytes": int(memory.used),
            "memory_total_bytes": int(memory.total),
            "load_1m": load_1m,
        },
        "process": {
            "pid": int(_PROCESS.pid),
            "uptime_seconds": max(0.0, time.time() - _PROCESS_STARTED),
            "rss_bytes": int(_PROCESS.memory_info().rss),
        },
        "runtime": {
            "python_version": platform.python_version(),
            "platform": platform.platform(),
            "inference_mode": inference_mode(),
        },
    }


def inference_mode() -> str:
    mode = os.getenv("SOVEREIGN_INFERENCE_MODE", "mock").strip().lower()
    return mode if mode in {"mock", "ollama"} else "unavailable"


def _ollama_settings() -> tuple[str, str]:
    base_url = os.getenv("SOVEREIGN_OLLAMA_URL", "http://127.0.0.1:11434").strip()
    model = os.getenv("SOVEREIGN_OLLAMA_MODEL", "llama3.2").strip()
    if not model or len(model) > 200:
        raise ValueError("SOVEREIGN_OLLAMA_MODEL must be between 1 and 200 characters")
    return base_url, model


def _validated_ollama_base_url(value: str) -> str:
    try:
        parsed = urlsplit(value)
        hostname = parsed.hostname
        port = parsed.port
    except ValueError as exc:
        raise ValueError("Ollama URL is invalid") from exc
    if (
        parsed.scheme != "http"
        or not hostname
        or parsed.username is not None
        or parsed.password is not None
        or parsed.query
        or parsed.fragment
        or parsed.path not in ("", "/")
    ):
        raise ValueError("Ollama URL must be a plain HTTP loopback origin")
    host = hostname.lower().rstrip(".")
    loopback = host == "localhost"
    if not loopback:
        try:
            loopback = ip_address(host).is_loopback
        except ValueError:
            loopback = False
    if not loopback:
        raise ValueError("Ollama URL host must be localhost or a loopback IP address")
    if port is not None and not (1 <= port <= 65535):
        raise ValueError("Ollama URL port is invalid")
    return f"http://{parsed.netloc}"


def _ollama_client(base_url: str) -> httpx.Client:
    return httpx.Client(
        base_url=base_url,
        timeout=httpx.Timeout(2.0, connect=1.0),
        trust_env=False,
        follow_redirects=False,
    )


def inference_status() -> dict[str, Any]:
    mode = inference_mode()
    if mode == "mock":
        return {
            "mode": "mock",
            "provider": "mock",
            "real_model_available": False,
            "model": None,
            "note": "Explicit mock mode; no model inference is performed.",
        }
    if mode != "ollama":
        return {
            "mode": "unavailable",
            "provider": "ollama",
            "real_model_available": False,
            "model": None,
            "note": "Unsupported SOVEREIGN_INFERENCE_MODE; use mock or ollama.",
        }

    try:
        raw_url, model = _ollama_settings()
        base_url = _validated_ollama_base_url(raw_url)
        with _ollama_client(base_url) as client:
            response = client.get("/api/tags")
            response.raise_for_status()
            tags = response.json().get("models", [])
        available_models = {entry.get("name") for entry in tags if isinstance(entry, dict)}
        available = model in available_models or (
            ":" not in model
            and any(name.split(":", 1)[0] == model for name in available_models if isinstance(name, str))
        )
        note = (
            "Local Ollama model is available."
            if available
            else "Ollama is reachable, but the configured local model is not installed."
        )
        return {
            "mode": "ollama",
            "provider": "ollama",
            "real_model_available": available,
            "model": model if available else None,
            "note": note,
        }
    except (ValueError, httpx.HTTPError, OSError, TypeError, AttributeError):
        return {
            "mode": "ollama",
            "provider": "ollama",
            "real_model_available": False,
            "model": None,
            "note": "Configured local Ollama endpoint or model is unavailable.",
        }


def generate_inference(prompt: str) -> dict[str, Any]:
    mode = inference_mode()
    if mode == "mock":
        return {
            "provider": "mock",
            "model": None,
            "mode": "mock",
            "response": f"Mock response (no model inference performed): {prompt}",
            "evidence_status": "mock",
        }
    if mode != "ollama":
        raise HTTPException(status_code=503, detail="Inference mode is not configured")

    try:
        raw_url, model = _ollama_settings()
        base_url = _validated_ollama_base_url(raw_url)
        with _ollama_client(base_url) as client:
            response = client.post(
                "/api/generate",
                json={"model": model, "prompt": prompt, "stream": False},
            )
            response.raise_for_status()
            result = response.json()
        generated = result.get("response")
        if not isinstance(generated, str):
            raise ValueError("Ollama response did not contain text")
        return {
            "provider": "ollama",
            "model": model,
            "mode": "ollama",
            "response": generated,
            "evidence_status": "local_model_output",
        }
    except (ValueError, httpx.HTTPError, OSError, TypeError, AttributeError) as exc:
        raise HTTPException(status_code=503, detail="Configured local Ollama model is unavailable") from exc


def _pendulum_energy(theta: float, omega: float, mass: float, length: float, gravity: float) -> float:
    return 0.5 * mass * (length * omega) ** 2 + mass * gravity * length * (1.0 - math.cos(theta))


def _derivative(theta: float, omega: float, gravity: float, length: float) -> tuple[float, float]:
    return omega, -(gravity / length) * math.sin(theta)


def _rk4_step(theta: float, omega: float, step: float, gravity: float, length: float) -> tuple[float, float]:
    k1_theta, k1_omega = _derivative(theta, omega, gravity, length)
    k2_theta, k2_omega = _derivative(
        theta + step * k1_theta / 2, omega + step * k1_omega / 2, gravity, length
    )
    k3_theta, k3_omega = _derivative(
        theta + step * k2_theta / 2, omega + step * k2_omega / 2, gravity, length
    )
    k4_theta, k4_omega = _derivative(theta + step * k3_theta, omega + step * k3_omega, gravity, length)
    next_theta = theta + step * (k1_theta + 2 * k2_theta + 2 * k3_theta + k4_theta) / 6
    next_omega = omega + step * (k1_omega + 2 * k2_omega + 2 * k3_omega + k4_omega) / 6
    return next_theta, next_omega


def simulate_pendulum(parameters: dict[str, float]) -> dict[str, Any]:
    length = parameters["length_m"]
    mass = parameters["mass_kg"]
    initial_theta = parameters["initial_angle_rad"]
    initial_omega = parameters["initial_angular_velocity_rad_s"]
    gravity = parameters["gravity_m_s2"]
    duration = parameters["duration_s"]
    dt = parameters["dt_s"]
    if duration / dt > 100_000:
        raise HTTPException(status_code=422, detail="duration_s / dt_s must not exceed 100000 steps")
    steps = math.ceil(duration / dt)

    stride = max(1, math.ceil(steps / (MAX_TRACE_POINTS - 1)))
    theta, omega, t = initial_theta, initial_omega, 0.0
    initial_energy = _pendulum_energy(theta, omega, mass, length, gravity)
    max_energy_deviation = 0.0
    trace: list[dict[str, float]] = []
    upward_crossings: list[float] = []

    def append_point(time_s: float, angle: float, angular_velocity: float) -> None:
        trace.append(
            {
                "t_s": time_s,
                "theta_rad": angle,
                "omega_rad_s": angular_velocity,
                "energy_j": _pendulum_energy(angle, angular_velocity, mass, length, gravity),
            }
        )

    append_point(0.0, theta, omega)
    for index in range(1, steps + 1):
        step = min(dt, duration - t)
        previous_t, previous_theta = t, theta
        theta, omega = _rk4_step(theta, omega, step, gravity, length)
        t = min(duration, t + step)
        energy = _pendulum_energy(theta, omega, mass, length, gravity)
        max_energy_deviation = max(max_energy_deviation, abs(energy - initial_energy))
        if previous_theta < 0 <= theta and omega > 0 and theta != previous_theta:
            fraction = -previous_theta / (theta - previous_theta)
            upward_crossings.append(previous_t + fraction * step)
        if index % stride == 0 or index == steps:
            append_point(t, theta, omega)

    simulated_period = (
        upward_crossings[-1] - upward_crossings[-2] if len(upward_crossings) >= 2 else None
    )
    relative_drift = max_energy_deviation / max(abs(initial_energy), 1e-15)
    return {
        "solver": "RK4",
        "evidence_status": "simulated",
        "parameters": parameters,
        "theoretical_period_s": 2 * math.pi * math.sqrt(length / gravity),
        "simulated_period_s": simulated_period,
        "relative_energy_drift": relative_drift,
        "trace": trace,
    }

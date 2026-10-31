from datetime import datetime
import math

import pytest
from fastapi.testclient import TestClient

from modelark_api import capabilities
from modelark_api.main import app

client = TestClient(app)


def pendulum_payload(**overrides):
    values = {
        "length_m": 1.0,
        "mass_kg": 1.0,
        "initial_angle_rad": 0.2,
        "initial_angular_velocity_rad_s": 0.0,
        "gravity_m_s2": 9.80665,
        "duration_s": 20.0,
        "dt_s": 0.005,
    }
    values.update(overrides)
    return values


def test_telemetry_shape_and_live_values():
    response = client.get("/api/telemetry")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "live"
    datetime.fromisoformat(data["timestamp"])
    assert set(data["host"]) == {
        "cpu_percent", "memory_percent", "memory_used_bytes", "memory_total_bytes", "load_1m"
    }
    assert set(data["process"]) == {"pid", "uptime_seconds", "rss_bytes"}
    assert set(data["runtime"]) == {"python_version", "platform", "inference_mode"}
    assert data["process"]["pid"] > 0
    assert data["process"]["rss_bytes"] > 0
    assert data["host"]["memory_total_bytes"] >= data["host"]["memory_used_bytes"]


def test_rk4_pendulum_period_and_energy():
    response = client.post("/api/physics/pendulum", json=pendulum_payload())
    assert response.status_code == 200
    result = response.json()
    expected_period = 2 * math.pi * math.sqrt(1 / 9.80665)
    assert result["solver"] == "RK4"
    assert result["evidence_status"] == "simulated"
    assert result["parameters"] == pendulum_payload()
    # Finite-amplitude motion has a slightly longer period than the small-angle theory.
    assert result["simulated_period_s"] == pytest.approx(expected_period, rel=0.003)
    assert result["theoretical_period_s"] == pytest.approx(expected_period)
    assert result["relative_energy_drift"] < 1e-7
    assert result["trace"][0]["t_s"] == 0
    assert result["trace"][-1]["t_s"] == pytest.approx(20.0)
    assert all(set(point) == {"t_s", "theta_rad", "omega_rad_s", "energy_j"} for point in result["trace"])


def test_pendulum_input_bounds_and_bounded_decimated_trace():
    assert client.post("/api/physics/pendulum", json=pendulum_payload(length_m=0)).status_code == 422
    assert client.post("/api/physics/pendulum", json=pendulum_payload(dt_s=0)).status_code == 422
    assert client.post("/api/physics/pendulum", json=pendulum_payload(dt_s=1e-320)).status_code == 422
    assert client.post("/api/physics/pendulum", json=pendulum_payload(gravity_m_s2=101)).status_code == 422
    assert client.post(
        "/api/physics/pendulum", json=pendulum_payload(duration_s=100, dt_s=0.0001)
    ).status_code == 422
    result = client.post(
        "/api/physics/pendulum", json=pendulum_payload(duration_s=100, dt_s=0.001)
    ).json()
    assert len(result["trace"]) <= capabilities.MAX_TRACE_POINTS


def test_mock_inference_is_explicit_and_does_not_claim_a_real_model(monkeypatch):
    monkeypatch.delenv("SOVEREIGN_INFERENCE_MODE", raising=False)
    status = client.get("/api/inference/status")
    assert status.status_code == 200
    assert status.json() == {
        "mode": "mock",
        "provider": "mock",
        "real_model_available": False,
        "model": None,
        "note": "Explicit mock mode; no model inference is performed.",
    }
    generated = client.post("/api/inference/generate", json={"prompt": "hello"})
    assert generated.status_code == 200
    assert generated.json() == {
        "provider": "mock",
        "model": None,
        "mode": "mock",
        "response": "Mock response (no model inference performed): hello",
        "evidence_status": "mock",
    }
    assert client.post("/api/inference/generate", json={"prompt": ""}).status_code == 422
    assert client.post("/api/inference/generate", json={"prompt": "x" * 4001}).status_code == 422


def test_ollama_url_accepts_loopback_and_rejects_non_loopback():
    for url in (
        "http://127.0.0.1:11434",
        "http://localhost:11434",
        "http://[::1]:11434",
    ):
        assert capabilities._validated_ollama_base_url(url) == url
    for url in (
        "http://8.8.8.8:11434",
        "http://localhost.evil.example:11434",
        "https://localhost:11434",
        "http://user:pass@localhost:11434",
        "http://localhost:11434/path",
    ):
        with pytest.raises(ValueError):
            capabilities._validated_ollama_base_url(url)


def test_configured_remote_ollama_is_unavailable_without_network_fallback(monkeypatch):
    monkeypatch.setenv("SOVEREIGN_INFERENCE_MODE", "ollama")
    monkeypatch.setenv("SOVEREIGN_OLLAMA_URL", "http://203.0.113.15:11434")
    status = client.get("/api/inference/status")
    assert status.status_code == 200
    assert status.json()["real_model_available"] is False
    assert status.json()["model"] is None
    generated = client.post("/api/inference/generate", json={"prompt": "test"})
    assert generated.status_code == 503



def test_ollama_status_recognizes_default_latest_tag(monkeypatch):
    class TagsResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"models": [{"name": "llama3.2:latest"}]}

    class TagsClient:
        def __enter__(self):
            return self

        def __exit__(self, *_args):
            return None

        def get(self, path):
            assert path == "/api/tags"
            return TagsResponse()

    monkeypatch.setenv("SOVEREIGN_INFERENCE_MODE", "ollama")
    monkeypatch.setenv("SOVEREIGN_OLLAMA_URL", "http://127.0.0.1:11434")
    monkeypatch.setenv("SOVEREIGN_OLLAMA_MODEL", "llama3.2")
    monkeypatch.setattr(capabilities, "_ollama_client", lambda _url: TagsClient())

    result = client.get("/api/inference/status").json()
    assert result["real_model_available"] is True
    assert result["model"] == "llama3.2"

#!/usr/bin/env python3
"""Small, dependency-free sandbox control-plane prototype.

The daemon never opens a host Docker socket. If enabled, it talks to a separate
Docker Engine endpoint supplied by DOCKER_HOST (normally the dind service in
sandbox/runtime/docker-compose.yml). Container execution is opt-in and every
request is recorded in a hash-chained audit log.
"""
from __future__ import annotations

import hashlib
import json
import os
import threading
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, field
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

HOST = os.getenv("SANDBOXD_HOST", "0.0.0.0")
PORT = int(os.getenv("SANDBOXD_PORT", "2376"))
STATE_DIR = Path(os.getenv("SANDBOX_STATE_DIR", "/var/lib/sandboxd"))
AUDIT_FILE = STATE_DIR / "audit.jsonl"
ENABLE_DOCKER = os.getenv("SANDBOX_ENABLE_DOCKER", "false").lower() == "true"
ALLOWED_IMAGES = tuple(
    value.strip() for value in os.getenv(
        "SANDBOX_ALLOWED_IMAGES", "python:3.12-slim,alpine:3.20"
    ).split(",") if value.strip()
)
MAX_MEMORY_BYTES = int(os.getenv("SANDBOX_MAX_MEMORY_BYTES", str(2 * 1024**3)))
MAX_CPUS = float(os.getenv("SANDBOX_MAX_CPUS", "1.0"))


@dataclass
class SandboxContext:
    image: str
    command: list[str]
    name: str
    memory_bytes: int = 512 * 1024**2
    cpus: float = 1.0
    network_policy: str = "isolated"
    metadata: dict[str, Any] = field(default_factory=dict)


class HookError(RuntimeError):
    pass


class Hook:
    async_name = "hook"

    def pre_create(self, ctx: SandboxContext) -> SandboxContext:
        return ctx

    def post_create(self, ctx: SandboxContext, result: dict[str, Any]) -> None:
        return None

    def pre_start(self, ctx: SandboxContext) -> None:
        return None

    def post_start(self, ctx: SandboxContext, result: dict[str, Any]) -> None:
        return None

    def pre_exec(self, ctx: SandboxContext) -> None:
        return None

    def post_exec(self, ctx: SandboxContext, result: dict[str, Any]) -> None:
        return None

    def pre_destroy(self, ctx: SandboxContext) -> None:
        return None

    def on_error(self, ctx: SandboxContext, error: Exception) -> None:
        return None


class ImagePolicyHook(Hook):
    def pre_create(self, ctx: SandboxContext) -> SandboxContext:
        if not any(ctx.image == prefix or ctx.image.startswith(prefix) for prefix in ALLOWED_IMAGES):
            raise HookError(f"image is not allowlisted: {ctx.image}")
        if ctx.memory_bytes <= 0 or ctx.memory_bytes > MAX_MEMORY_BYTES:
            raise HookError("memory limit exceeds sandbox quota")
        if ctx.cpus <= 0 or ctx.cpus > MAX_CPUS:
            raise HookError("CPU limit exceeds sandbox quota")
        if ctx.network_policy not in {"isolated", "none"}:
            raise HookError("network_policy must be isolated or none")
        return ctx


class AuditHook(Hook):
    def record(self, event: str, payload: dict[str, Any]) -> None:
        STATE_DIR.mkdir(parents=True, exist_ok=True)
        previous = "genesis"
        if AUDIT_FILE.exists():
            try:
                last = AUDIT_FILE.read_text(encoding="utf-8").splitlines()[-1]
                previous = json.loads(last)["entry_hash"]
            except (IndexError, KeyError, json.JSONDecodeError):
                previous = "corrupt-history"
        entry = {
            "timestamp": time.time(),
            "event": event,
            "payload": payload,
            "previous_hash": previous,
        }
        entry["entry_hash"] = hashlib.sha256(
            json.dumps(entry, sort_keys=True, separators=(",", ":")).encode()
        ).hexdigest()
        with AUDIT_FILE.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(entry, sort_keys=True) + "\n")


class DockerEngine:
    def __init__(self) -> None:
        raw = os.getenv("DOCKER_HOST", "tcp://docker:2375")
        parsed = urllib.parse.urlsplit(raw)
        if parsed.scheme != "tcp" or not parsed.hostname or parsed.path not in ("", "/"):
            raise ValueError("DOCKER_HOST must be a tcp://host:port endpoint")
        self.base = f"http://{parsed.hostname}:{parsed.port or 2375}"

    def request(self, method: str, path: str, payload: dict[str, Any] | None = None) -> dict[str, Any]:
        body = None if payload is None else json.dumps(payload).encode()
        request = urllib.request.Request(
            self.base + path,
            data=body,
            method=method,
            headers={"Content-Type": "application/json"} if body else {},
        )
        try:
            with urllib.request.urlopen(request, timeout=10) as response:
                raw = response.read()
        except urllib.error.HTTPError as error:
            raise RuntimeError(f"Docker API returned HTTP {error.code}") from error
        return json.loads(raw) if raw else {}

    def create(self, ctx: SandboxContext) -> dict[str, Any]:
        # Both supported policies default to no network. A future explicit
        # allowlist can add a named internal network without weakening this
        # default.
        network_mode = "none"
        path = "/containers/create?" + urllib.parse.urlencode({"name": ctx.name})
        return self.request("POST", path, {
            "Image": ctx.image,
            "Cmd": ctx.command,
            "HostConfig": {
                "Memory": ctx.memory_bytes,
                "NanoCpus": int(ctx.cpus * 1_000_000_000),
                "NetworkMode": network_mode,
                "AutoRemove": True,
            },
            "Labels": {"managed-by": "sandboxd", "sandbox-name": ctx.name},
        })

    def start(self, container_id: str) -> dict[str, Any]:
        return self.request("POST", f"/containers/{container_id}/start")


class SandboxService:
    def __init__(self) -> None:
        self.audit = AuditHook()
        self.hooks: list[Hook] = [ImagePolicyHook()]
        self.lock = threading.Lock()
        self.containers: dict[str, dict[str, Any]] = {}

    def info(self) -> dict[str, Any]:
        return {
            "status": "ok",
            "mode": "isolated-control-plane",
            "docker_enabled": ENABLE_DOCKER,
            "host_socket_mounted": False,
            "network_policy": "internal-only",
            "allowed_images": ALLOWED_IMAGES,
            "quotas": {"memory_bytes": MAX_MEMORY_BYTES, "cpus": MAX_CPUS},
        }

    def create(self, request: dict[str, Any]) -> dict[str, Any]:
        ctx = SandboxContext(
            image=str(request.get("image", "")),
            command=[str(item) for item in request.get("command", ["/bin/sh"])],
            name=str(request.get("name", f"sandbox-{int(time.time())}")),
            memory_bytes=int(request.get("memory_bytes", 512 * 1024**2)),
            cpus=float(request.get("cpus", 1.0)),
            network_policy=str(request.get("network_policy", "isolated")),
            metadata=dict(request.get("metadata", {})),
        )
        try:
            for hook in self.hooks:
                ctx = hook.pre_create(ctx)
            if not ENABLE_DOCKER:
                result = {"id": ctx.name, "status": "planned", "context": ctx.__dict__}
            else:
                engine = DockerEngine()
                result = engine.create(ctx)
                result["status"] = "created"
            self.audit.record("pre_create/post_create", {"context": ctx.__dict__, "result": result})
            with self.lock:
                self.containers[ctx.name] = result
            return result
        except Exception as error:
            self.audit.record("on_error", {"name": ctx.name, "error": str(error)})
            raise


service = SandboxService()


class Handler(BaseHTTPRequestHandler):
    server_version = "sandboxd/0.1"

    def log_message(self, format: str, *args: Any) -> None:
        return None

    def send_json(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, sort_keys=True).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        if self.path == "/info":
            self.send_json(200, service.info())
        elif self.path == "/v1/sandboxes":
            self.send_json(200, {"sandboxes": service.containers})
        else:
            self.send_json(404, {"error": "not found"})

    def do_POST(self) -> None:
        if self.path != "/v1/sandboxes":
            self.send_json(404, {"error": "not found"})
            return
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if size > 64 * 1024:
                raise ValueError("request too large")
            payload = json.loads(self.rfile.read(size) or b"{}")
            self.send_json(201, service.create(payload))
        except (HookError, ValueError, RuntimeError) as error:
            self.send_json(400, {"error": str(error)})
        except Exception as error:
            self.send_json(500, {"error": "sandbox operation failed", "detail": str(error)})


if __name__ == "__main__":
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()

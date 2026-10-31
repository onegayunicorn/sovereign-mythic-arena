import { useEffect, useState } from "react";

type Telemetry = {
  status: "live";
  timestamp: string;
  host: {
    cpu_percent: number;
    memory_percent: number;
    memory_used_bytes: number;
    memory_total_bytes: number;
    load_1m: number;
  };
  process: { pid: number; uptime_seconds: number; rss_bytes: number };
  runtime: { python_version: string; platform: string; inference_mode: string };
};

type InferenceStatus = {
  mode: string;
  provider: string;
  real_model_available: boolean;
  model: string;
  note: string;
};

type Sample = { at: number; cpu: number; memory: number };
type Connection = "checking" | "live" | "offline";

const POLL_INTERVAL_MS = 2_000;
const HISTORY_LIMIT = 24;
const blueprintNodes = [
  ["apps/", "PWA, console, API, CLI", "Application layer"],
  ["packages/", "contracts, auth, storage, policy", "Shared foundations"],
  ["ml/", "registry, evaluation, serving", "Model lifecycle"],
  ["paean/", "manifest, harness, scoring, ledger", "Evaluation harness"],
  ["infra/", "compose, Kubernetes, air-gap", "Deployment options"],
  ["docs/", "model cards, runbooks, compliance", "Documentation"],
];

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: "no-store", headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return response.json() as Promise<T>;
}

function formatBytes(bytes: number | undefined): string {
  if (bytes === undefined || !Number.isFinite(bytes)) return "—";
  const gib = bytes / 1_073_741_824;
  return gib >= 1 ? `${gib.toFixed(2)} GB` : `${(bytes / 1_048_576).toFixed(0)} MB`;
}

function formatUptime(seconds: number | undefined): string {
  if (seconds === undefined || !Number.isFinite(seconds)) return "—";
  const total = Math.max(0, Math.floor(seconds));
  const days = Math.floor(total / 86_400);
  const hours = Math.floor((total % 86_400) / 3_600);
  const minutes = Math.floor((total % 3_600) / 60);
  const remainder = total % 60;
  return days > 0 ? `${days}d ${hours}h ${minutes}m` : `${hours}h ${minutes}m ${remainder}s`;
}

function displayNumber(value: number | undefined, suffix = ""): string {
  return value === undefined || !Number.isFinite(value) ? "—" : `${value.toFixed(1)}${suffix}`;
}

function HistoryChart({ samples }: { samples: Sample[] }) {
  const points = (key: "cpu" | "memory") => samples.map((sample, index) => {
    const x = samples.length < 2 ? 300 : (index / (samples.length - 1)) * 580 + 10;
    const y = 160 - (Math.max(0, Math.min(100, sample[key])) / 100) * 140;
    return `${x},${y}`;
  }).join(" ");

  return <div className="chart-wrap">
    <div className="chart-legend"><span><i className="legend-cpu" /> CPU</span><span><i className="legend-memory" /> RAM</span><small>LAST {samples.length} SAMPLES</small></div>
    <svg className="history-chart" viewBox="0 0 600 180" role="img" aria-label="Client-side CPU and RAM history in percent">
      {[20, 55, 90, 125, 160].map((y, index) => <g key={y}><line x1="10" x2="590" y1={y} y2={y} className="chart-grid" /><text x="0" y={y - 3} className="chart-label">{100 - index * 25}</text></g>)}
      {samples.length > 0 && <><polyline points={points("cpu")} className="chart-line chart-line-cpu"/><polyline points={points("memory")} className="chart-line chart-line-memory"/></>}
    </svg>
    {samples.length === 0 && <p className="chart-empty">Samples appear after live telemetry is received.</p>}
  </div>;
}

export function App() {
  const [telemetry, setTelemetry] = useState<Telemetry | null>(null);
  const [inference, setInference] = useState<InferenceStatus | null>(null);
  const [connection, setConnection] = useState<Connection>("checking");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [tab, setTab] = useState("Overview");

  useEffect(() => {
    let active = true;
    let timer = 0;
    let controller: AbortController | null = null;

    const poll = async () => {
      controller = new AbortController();
      const started = performance.now();
      try {
        const telemetryResponse = await fetch("/api/telemetry", {
          cache: "no-store",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        const elapsed = Math.round(performance.now() - started);
        if (!telemetryResponse.ok) throw new Error(`Telemetry returned HTTP ${telemetryResponse.status}`);
        const nextTelemetry = await telemetryResponse.json() as Telemetry;
        if (nextTelemetry.status !== "live") throw new Error("Telemetry response is not live");
        if (!active) return;

        setTelemetry(nextTelemetry);
        setConnection("live");
        setLatencyMs(elapsed);
        setSamples((current) => [
          ...current,
          { at: Date.now(), cpu: nextTelemetry.host.cpu_percent, memory: nextTelemetry.host.memory_percent },
        ].slice(-HISTORY_LIMIT));

        try {
          const nextInference = await getJson<InferenceStatus>("/api/inference/status");
          if (active) setInference(nextInference);
        } catch {
          if (active) setInference(null);
        }
      } catch {
        if (active) {
          setTelemetry(null);
          setInference(null);
          setConnection("offline");
          setLatencyMs(null);
        }
      } finally {
        if (active) timer = window.setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    void poll();
    return () => {
      active = false;
      window.clearTimeout(timer);
      controller?.abort();
    };
  }, []);

  const isLive = connection === "live" && telemetry !== null;
  const freshness = telemetry?.timestamp ? new Date(telemetry.timestamp).toLocaleTimeString() : "—";
  const connectionText = connection === "checking" ? "CHECKING API" : connection === "live" ? "API CONNECTED" : "API OFFLINE";

  return <div className="shell">
    <header className="top">
      <a className="brand" href="#home"><b>MA</b><span>MODELARK<small>SOVEREIGN SYSTEMS</small></span></a>
      <nav aria-label="Sections">{["Overview", "Blueprint", "Paean", "Device Lab"].map((item) => <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>{item}</button>)}</nav>
      <div className={`live ${connection}`}><i />{connectionText}</div>
    </header>

    <main id="home">
      <section className="hero">
        <div><p className="eyebrow">SOVEREIGN AI · CONTROL PLANE <span>BUILD 0.1.0</span></p><h1>Own the stack.<br/><em>Prove the physics.</em></h1><p className="lede">A local-first workspace for model operations, reproducible mythic-stack bouts, and device-learning experiments. Evidence first; no cloud required.</p><div className="actions"><a className="button primary" href="#runtime">OPEN LIVE DASHBOARD ↘</a><a className="button" href="#blueprint">EXPLORE BLUEPRINT</a></div><div className="hero-note"><span className={`pulse ${isLive ? "" : "inactive"}`} /> API-OBSERVED HOST TELEMETRY <span>·</span> CLIENT POLL: 2 SEC</div></div>
        <div className="orbit" aria-label="Planned sovereign system architecture diagram"><div className="orbit-core">MODEL<br/>ARK</div><i className="orb o1">API</i><i className="orb o2">ML</i><i className="orb o3">PWA</i><i className="orb o4">LEDGER</i><div className="orbit-caption">PLANNED ARCHITECTURE / 00</div></div>
      </section>

      <section id="runtime" className="runtime">
        <div className="section-head"><div><p className="eyebrow">01 / LIVE OPERATIONS</p><h2>Runtime telemetry</h2></div><span className={`fresh ${isLive ? "observed" : "unavailable"}`}>{isLive ? `LAST OBSERVED ${freshness}` : "API OFFLINE / TELEMETRY UNAVAILABLE"}</span></div>
        <div className="metrics">
          {[
            ["HOST CPU", isLive ? displayNumber(telemetry.host.cpu_percent, "%") : "—", "observed host usage"],
            ["HOST RAM", isLive ? displayNumber(telemetry.host.memory_percent, "%") : "—", isLive ? `${formatBytes(telemetry.host.memory_used_bytes)} / ${formatBytes(telemetry.host.memory_total_bytes)}` : "observed host usage"],
            ["API PROCESS UPTIME", isLive ? formatUptime(telemetry.process.uptime_seconds) : "—", isLive ? `PID ${telemetry.process.pid}` : "observed process"],
            ["API LATENCY", isLive && latencyMs !== null ? `${latencyMs} ms` : "—", connection === "checking" ? "waiting for local API" : isLive ? "telemetry request round-trip" : "no API response"],
          ].map(([label, value, sub]) => <article className="metric" key={label}><small>{label}</small><strong>{value}</strong><span>{sub}</span></article>)}
        </div>

        {!isLive && <div className="offline-banner" role="status"><b>API OFFLINE / TELEMETRY UNAVAILABLE</b><span>Live host and process metrics are not available. Start the local API to populate this panel.</span></div>}

        <div className="runtime-grid">
          <article className="panel telemetry-panel">
            <div className="panel-title"><span>OBSERVED HOST &amp; PROCESS</span><small>{isLive ? "LIVE API DATA" : "AWAITING API"}</small></div>
            {isLive ? <div className="observed-details">
              <div><span>1-MINUTE LOAD</span><b>{displayNumber(telemetry.host.load_1m)}</b></div>
              <div><span>PROCESS RSS</span><b>{formatBytes(telemetry.process.rss_bytes)}</b></div>
              <div><span>RUNTIME</span><b>{telemetry.runtime.python_version} · {telemetry.runtime.platform}</b></div>
              <div><span>INFERENCE MODE</span><b>{telemetry.runtime.inference_mode || "—"}</b></div>
            </div> : <div className="empty-panel">No host, process, or runtime values have been observed from the API.</div>}
          </article>
          <article className="panel inference-panel">
            <div className="panel-title"><span>INFERENCE PROVIDER</span><small>{inference ? "LIVE API DATA" : "NOT OBSERVED"}</small></div>
            {inference ? <div className="inference-content">
              <div className="provider-heading"><strong>{inference.provider || "Provider not specified"}</strong><span className="tag observed-tag">{inference.mode || "MODE UNKNOWN"}</span></div>
              <p><b>Model:</b> {inference.model || "Not specified"}</p>
              <p><b>Real model available:</b> {inference.real_model_available ? "Yes" : "No"}</p>
              {inference.note && <p className="provider-note">{inference.note}</p>}
            </div> : <div className="empty-panel">{isLive ? "Inference status has not been returned by the API." : "Provider mode will be shown when the API is available."}</div>}
          </article>
        </div>

        <div className="runtime-grid history-grid">
          <article className="panel"><div className="panel-title"><span>CLIENT-SIDE HISTORY</span><small>OBSERVED SAMPLES ONLY</small></div><HistoryChart samples={samples}/></article>
          <article className="panel"><div className="panel-title"><span>RECENT SAMPLES</span><small>{samples.length} / {HISTORY_LIMIT}</small></div>
            {samples.length > 0 ? <div className="sample-list">{samples.slice(-5).reverse().map((sample) => <div className="sample-row" key={sample.at}><time>{new Date(sample.at).toLocaleTimeString()}</time><span>CPU <b>{displayNumber(sample.cpu, "%")}</b></span><span>RAM <b>{displayNumber(sample.memory, "%")}</b></span></div>)}</div> : <div className="empty-panel">No samples yet. The list fills only from successful telemetry responses.</div>}
            <p className="note">History is held in this browser session and is not a backend event stream.</p>
          </article>
        </div>
      </section>

      <section id="blueprint" className="blueprint"><div className="section-head"><div><p className="eyebrow">02 / REPOSITORY MAP</p><h2>One tree. Clear boundaries.</h2></div><span className="fresh">PLANNED BLUEPRINT · NOT LIVE HEALTH</span></div><div className="blueprint-note">This map describes intended project areas only. It does not indicate that any service is running or healthy.</div><div className="tree">{blueprintNodes.map(([path, description, label], index) => <div className="tree-row" key={path}><span>{String(index + 1).padStart(2, "0")}</span><code>{path}</code><p>{description}</p><b>{label}</b></div>)}</div></section>

      <section className="principles"><p className="eyebrow">03 / OPERATING CONTRACT</p><div className="principle-grid"><article><b>01</b><h3>Air-gap native</h3><p>Vendored dependencies, signed bundles, offline install and restore workflow.</p></article><article><b>02</b><h3>Evidence over lore</h3><p>Separate proposed, simulated, measured, and hardware-verified claims.</p></article><article><b>03</b><h3>Local by default</h3><p>Device data and prompts stay local unless an explicit policy permits export.</p></article></div></section>
    </main>
    <footer><span>MODELARK SOVEREIGN · PAEAN BATTLE SYSTEM</span><span>LOCAL-FIRST · AUDITABLE · EXPERIMENTAL</span></footer>
  </div>;
}

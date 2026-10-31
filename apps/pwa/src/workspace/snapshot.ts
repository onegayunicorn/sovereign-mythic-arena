export interface LiveEvent { id: string; time: string; kind: string; detail: string }
export interface LiveSnapshot { nodes: number; queue: number; workers: number; egress: string; treeNodes: number; updatedAt: number; events: LiveEvent[] }
const kinds = ["policy.check", "worker.heartbeat", "artifact.verified", "pwa.sync", "ledger.append"];
const details = ["Default-deny policy active", "Local runtime heartbeat received", "Synthetic manifest hash matches", "Offline cache available", "Demo event stored locally"];
export function dashboardSnapshot(): LiveSnapshot {
  const now = Date.now();
  return { nodes: 6, queue: Math.floor((now / 2100) % 4), workers: 2, egress: "DENIED", treeNodes: 87, updatedAt: now,
    events: Array.from({length:5}, (_,i) => { const k = (Math.floor(now/1800)+i) % kinds.length; const t = new Date(now-i*19000).toLocaleTimeString(); return { id: `${now}-${i}`, time:t, kind:kinds[k], detail:details[k] }; }) };
}

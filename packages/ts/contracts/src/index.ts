export type EvidenceStatus = "proposed" | "simulated" | "measured" | "hardware-verified" | "production-backed";
export interface ArtifactManifest { id:string; sha256:string; parents:string[]; status:EvidenceStatus; createdAt:string; modelDigest?:string; datasetDigest?:string; }
export interface BlueprintNode { path:string; name:string; type:"directory"|"file"; parentPath:string|null; description:string; sort:number; language?:string; content?:string; }

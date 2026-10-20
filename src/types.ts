/**
 * Shared domain types.
 */
export type ProviderKind = "cloud" | "local" | "relay";
export type Mode = "agent" | "ask" | "swarm";
export type Effort = "low" | "medium" | "high" | "ultra";
/** Legacy aliases kept for persisted settings: "edits" ≡ "smart", boolean ≡ "always"/"never". */
export type AskPolicy = "always" | "smart" | "edits" | "never";
export type SidebarTab = "files" | "search" | "agents" | "memory";

export interface FsItem {
  path: string;
  name: string;
  is_dir: boolean;
  size: number;
}

export interface OpenFile {
  path: string;
  name?: string;
  content: string;
  saved: string;
  language: string;
}

export interface GitStatus {
  branch: string;
  changed: number;
  untracked: number;
  staged: number;
  ahead: number;
  behind: number;
  clean?: boolean;
  is_repo?: boolean;
  /** Legacy alias of `changed` produced by older backends. */
  dirty?: number;
}

export type MsgRole = "user" | "assistant" | "system";

/** A chat message as kept in the store (and persisted to localStorage). */
export interface Message {
  id: string;
  role: MsgRole;
  content: string;
  ts: number;
  toolCalls?: ToolCallRecord[];
  activity?: ActivityEvent[];
  stats?: AgentRunStats;
  error?: string;
  swarm?: { workers: SwarmWorker[]; plan: string[] };
}

/** A message as sent to the provider. */
export interface Msg {
  role: MsgRole;
  content: string;
}

export interface ToolCallRecord {
  id: string;
  tool: string;
  args: Record<string, unknown>;
  label: string;
  status: "ok" | "error";
  output?: string;
  ms?: number;
  agentId?: string;
}

export interface Usage {
  prompt: number;
  completion: number;
  total: number;
}

export interface AgentRunStats {
  turns: number;
  toolCalls: number;
  startedAt: number;
  finishedAt?: number;
  usage: Usage;
  cost: number;
  model: string;
}

export interface PendingQuestion {
  id: string;
  question: string;
  detail?: string;
  options?: string[];
}

export interface SwarmWorker {
  id: string;
  agent: string;
  task: string;
  status: "queued" | "running" | "done" | "failed";
  progress: number;
}

export interface ActivityEvent {
  id: string;
  kind: "info" | "tool" | "model" | "error";
  label: string;
  detail?: string;
  agentId?: string;
  status: "running" | "ok" | "error";
  tool?: { tool: string; args: Record<string, unknown> };
  result?: { ok: boolean; preview: string; ms: number };
  ts: number;
}

export interface LedgerEntry {
  key: string;
  description: string;
  path: string;
  kind: string;
  updated: number;
}

export interface Settings {
  provider: ProviderKind;
  apiKey: string;
  baseUrl: string;
  model: string;
  localModel: string;
  localPort: number;
  mode: Mode;
  effort: Effort;
  askPolicy: AskPolicy;
  activeAgent: string;
  autoRoute: boolean;
  planFirst: boolean;
  verifyResult: boolean;
  autoRecall: boolean;
  parallelSwarm: boolean;
  swarmSize: number;
  showActivity: boolean;
  sidebarTab: SidebarTab;
  theme: "dark" | "light";
  fontSize: number;
  wordWrap: boolean;
  autoSave: boolean;
}

export interface Toast {
  id: number;
  kind: "info" | "success" | "error" | "warn" | "ok";
  text: string;
  detail?: string;
}

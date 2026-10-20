/**
 * Settings persistence and provider presets.
 */
import type { Effort, Settings } from "../types";

const KEY = "infinitycoder.settings.v3";

export const RELAY_BASE_URL = "https://relay.infinitycoder.app";

export const CLOUD_MODELS: string[] = [
  "gpt-4.1",
  "gpt-4o",
  "claude-sonnet-4-5",
  "deepseek-chat",
  "qwen3-coder"
];

export const DEFAULT_SETTINGS: Settings = {
  provider: "cloud",
  apiKey: "",
  baseUrl: "https://api.openai.com",
  model: "gpt-4.1",
  localModel: "qwen-coder.gguf",
  localPort: 8080,
  mode: "agent",
  effort: "medium",
  askPolicy: "edits",
  activeAgent: "coder",
  autoRoute: true,
  ask: false,
  planFirst: true,
  verifyResult: true,
  autoRecall: true,
  parallelSwarm: false,
  swarmSize: 3,
  showActivity: true,
  sidebarTab: "files",
  theme: "dark",
  fontSize: 13,
  wordWrap: true,
  autoSave: false
};

export interface EffortPreset {
  maxTurns: number;
  temperature: number;
  maxTokens: number;
  label: string;
}

export const EFFORT_PRESETS: Record<Effort, EffortPreset> = {
  low: { maxTurns: 6, temperature: 0.1, maxTokens: 2048, label: "Быстро" },
  medium: { maxTurns: 16, temperature: 0.1, maxTokens: 4096, label: "Баланс" },
  high: { maxTurns: 32, temperature: 0.05, maxTokens: 8192, label: "Тщательно" },
  max: { maxTurns: 64, temperature: 0.0, maxTokens: 16384, label: "Максимум" }
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: Settings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* private mode / quota — settings simply do not persist */
  }
}

/**
 * IPC layer.
 *
 * In the Tauri build every call goes to the Rust backend through
 * `@tauri-apps/api/core`. In the plain browser build we fall back to the local
 * terminal bridge (`npm run bridge`, http://127.0.0.1:5299) for shell-ish
 * operations and to a localStorage-backed virtual filesystem otherwise, so the
 * UI stays fully explorable without Rust.
 */
import type { FsItem, GitStatus, LedgerEntry } from "../types";

/** A hit produced by the in-browser / bridge search backends. */
export interface SearchHit {
  path: string;
  line: number;
  /** Matching line text. Kept as `text` to stay in sync with store.SearchHit. */
  text: string;
}

export const isTauri: boolean =
  typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

async function invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(cmd, args);
}

async function http<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return (await res.json()) as T;
}

/* ------------------------------------------------------------------ *
 * Browser fallback: a tiny virtual filesystem in localStorage.
 * ------------------------------------------------------------------ */

const VFS_KEY = "infinitycoder.vfs.v3";

type Vfs = Record<string, string>;

function vfsLoad(): Vfs {
  try {
    return JSON.parse(localStorage.getItem(VFS_KEY) || "{}") as Vfs;
  } catch {
    return {};
  }
}

function vfsSave(v: Vfs) {
  localStorage.setItem(VFS_KEY, JSON.stringify(v));
}

function norm(p: string): string {
  return p.replace(/\\/g, "/").replace(/\/+$/, "") || "/";
}

function parentOf(p: string): string {
  const i = norm(p).lastIndexOf("/");
  return i <= 0 ? "/" : p.slice(0, i);
}

function baseName(p: string): string {
  const parts = norm(p).split("/");
  return parts[parts.length - 1] || p;
}

function listDirVirtual(root: string, dir: string): FsItem[] {
  const v = vfsLoad();
  const prefix = norm(dir) + "/";
  const seen = new Map<string, FsItem>();
  for (const key of Object.keys(v)) {
    if (!key.startsWith(prefix)) continue;
    const rest = key.slice(prefix.length);
    const slash = rest.indexOf("/");
    if (slash < 0) {
      seen.set(rest, { path: key, name: rest, is_dir: false, size: (v[key] || "").length });
    } else {
      const dname = rest.slice(0, slash);
      if (!seen.has(dname)) {
        seen.set(dname, { path: prefix + dname, name: dname, is_dir: true, size: 0 });
      }
    }
  }
  // The root itself may be empty; show a friendly starter file once.
  if (norm(dir) === norm(root) && seen.size === 0) {
    v[root + "/README.md"] = "# InfinityCoder\n\nОткройте папку и начните писать код.\n";
    vfsSave(v);
    return listDirVirtual(root, dir);
  }
  return [...seen.values()].sort((a, b) =>
    a.is_dir === b.is_dir ? a.name.localeCompare(b.name) : a.is_dir ? -1 : 1
  );
}

async function pickFolder(): Promise<string | null> {
  const dialogs = await import("@tauri-apps/plugin-dialog");
  const picked = await dialogs.open({ directory: true, multiple: false, title: "Открыть проект" });
  return typeof picked === "string" ? picked : null;
}

/* ------------------------------------------------------------------ *
 * Public API surface used by the store.
 * ------------------------------------------------------------------ */

export const api = {
  async aiStatus(): Promise<string> {
    if (isTauri) return invoke<string>("ai_status");
    try {
      await http<{ status: string }>("/api/status");
      return "ready";
    } catch {
      return "error:локальный режим доступен только в desktop-сборке";
    }
  },

  async openFolder(): Promise<string | null> {
    if (isTauri) return pickFolder();
    // Browsers cannot pick a real folder without a file input; keep it simple.
    return localStorage.getItem("infinitycoder.virtualRoot") || "/project";
  },

  async listDir(root: string, dir: string): Promise<FsItem[]> {
    if (isTauri) return invoke<FsItem[]>("list_dir", { root, dir });
    return listDirVirtual(root, dir);
  },

  async readFile(root: string, path: string): Promise<string> {
    if (isTauri) return invoke<string>("read_file", { root, path });
    const v = vfsLoad();
    if (path in v) return v[path];
    throw new Error(`файл не найден: ${path}`);
  },

  async writeFile(root: string, path: string, content: string): Promise<void> {
    if (isTauri) return invoke<void>("write_file", { root, path, content });
    const v = vfsLoad();
    v[norm(path)] = content;
    vfsSave(v);
  },

  async createDir(root: string, path: string): Promise<void> {
    if (isTauri) return invoke<void>("create_dir", { root, path });
    const v = vfsLoad();
    const marker = norm(path) + "/.keep";
    if (!(marker in v)) v[marker] = "";
    vfsSave(v);
  },

  async deleteFile(root: string, path: string): Promise<void> {
    if (isTauri) return invoke<void>("delete_path", { root, path });
    const v = vfsLoad();
    const p = norm(path);
    for (const key of Object.keys(v)) {
      if (key === p || key.startsWith(p + "/")) delete v[key];
    }
    vfsSave(v);
  },

  async moveFile(root: string, from: string, to: string): Promise<void> {
    if (isTauri) return invoke<void>("move_path", { root, from, to });
    const v = vfsLoad();
    const f = norm(from);
    const t = norm(to);
    for (const key of Object.keys(v)) {
      if (key === f) {
        v[t] = v[key];
        delete v[key];
      } else if (key.startsWith(f + "/")) {
        v[t + key.slice(f.length)] = v[key];
        delete v[key];
      }
    }
    vfsSave(v);
  },

  async searchFiles(
    root: string,
    dir: string,
    query: string,
    _glob?: string,
    limit = 200
  ): Promise<SearchHit[]> {
    if (isTauri) {
      return invoke<Array<{ path: string; line: number; text: string }>>("search_files", {
        root,
        dir,
        query,
        limit
      }).then((hits) => hits.map((h) => ({ path: h.path, line: h.line, text: h.text })));
    }
    const v = vfsLoad();
    const q = query.toLowerCase();
    const out: SearchHit[] = [];
    for (const [path, content] of Object.entries(v)) {
      const lines = content.split("\n");
      for (let i = 0; i < lines.length && out.length < limit; i++) {
        if (lines[i].toLowerCase().includes(q)) {
          out.push({ path, line: i + 1, text: lines[i].trim().slice(0, 200) });
        }
      }
      if (out.length >= limit) break;
    }
    return out;
  },

  async workspaceInfo(
    root: string
  ): Promise<{ files: number; symbols: number; memories: number; is_repo: boolean }> {
    if (isTauri) return invoke("workspace_info", { root });
    const v = vfsLoad();
    const files = Object.keys(v).filter((k) => !k.endsWith(".keep")).length;
    let symbols = 0;
    for (const c of Object.values(v)) {
      symbols += (c.match(/\b(function|class|def|fn|const|let|interface)\b/g) || []).length;
    }
    return { files, symbols, memories: memoryEntries().length, is_repo: false };
  },

  async gitStatus(root: string): Promise<GitStatus | null> {
    if (isTauri) return invoke<GitStatus>("git_status", { root });
    return null;
  },

  /* project memory ledger */
  async memoryList(root: string, limit = 200): Promise<LedgerEntry[]> {
    if (isTauri) return invoke<LedgerEntry[]>("memory_list", { root, limit });
    return memoryEntries().slice(0, limit);
  },

  async memorySearch(root: string, query: string, limit = 60): Promise<LedgerEntry[]> {
    if (isTauri) return invoke<LedgerEntry[]>("memory_search", { root, query, limit });
    const q = query.toLowerCase();
    return memoryEntries()
      .filter((e) => (e.key + e.description).toLowerCase().includes(q))
      .slice(0, limit);
  },

  async memoryWrite(
    root: string,
    key: string,
    description: string,
    path: string,
    kind: string
  ): Promise<void> {
    if (isTauri) return invoke<void>("memory_write", { root, key, description, path, kind });
    const entries = memoryEntries();
    const idx = entries.findIndex((e) => e.key === key);
    const entry: LedgerEntry = { key, description, path, kind, updated: Date.now() };
    if (idx >= 0) entries[idx] = entry;
    else entries.push(entry);
    localStorage.setItem(MEM_KEY, JSON.stringify(entries));
  },

  async memoryForget(root: string, key: string): Promise<void> {
    if (isTauri) return invoke<void>("memory_forget", { root, key });
    localStorage.setItem(MEM_KEY, JSON.stringify(memoryEntries().filter((e) => e.key !== key)));
  },

  async memoryReindex(root: string): Promise<number> {
    if (isTauri) return invoke<number>("memory_reindex", { root });
    return memoryEntries().length;
  }
};

const MEM_KEY = "infinitycoder.memory.v3";

function memoryEntries(): LedgerEntry[] {
  try {
    return JSON.parse(localStorage.getItem(MEM_KEY) || "[]") as LedgerEntry[];
  } catch {
    return [];
  }
}

export { baseName, parentOf, norm as normalizePath };

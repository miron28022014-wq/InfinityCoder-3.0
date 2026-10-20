/**
 * Agent engine.
 *
 * Drives one task from prompt to finished answer: sends the conversation to a
 * chat-completions endpoint (cloud or local llama.cpp), parses tool calls out
 * of the model's prose with the tolerant incremental parser, executes them
 * against the workspace, and streams visible text back through the activity
 * bus. Half-written JSON never reaches the transcript — `visiblePrefix` from
 * lib/parse guarantees that.
 */
import { complete as completeActivity, publish } from "./activity";
import { api } from "./ipc";
import { EFFORT_PRESETS } from "./settings";
import { parseToolCalls, stripCalls, visiblePrefix, type ParsedCall } from "./parse";
import type { Msg, OpenFile, PendingQuestion, Settings, SwarmWorker, Usage } from "../types";

export interface EngineHooks {
  getSettings: () => Settings;
  getRoot: () => string;
  getOpenFile: () => OpenFile | null;
  onQuestion: (q: PendingQuestion | null) => void;
  onTouched: (paths: string[]) => void;
  onWorkers: (w: SwarmWorker[]) => void;
  onUsage: (u: Usage) => void;
  onTextDelta: (text: string) => void;
}

export interface RunResult {
  text: string;
  turns: number;
  toolCalls: number;
  usage: Usage;
  workers: SwarmWorker[];
  plan: string[];
}

const SYSTEM_PROMPT = [
  "You are InfinityCoder, an autonomous coding agent inside the user's project.",
  "You may call tools by emitting blocks:",
  "<tool_call>{\"tool\":\"read_file\",\"args\":{\"path\":\"src/main.ts\"}}</tool_call>",
  "Available tools: list_dir, read_file, write_file, search_files, run_command, ask_user.",
  "When the task is done, answer in plain prose without tool blocks."
].join("\n");

interface ChatResponse {
  content: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}

export class AgentEngine {
  private hooks: EngineHooks;
  private cancelled = false;
  private controller: AbortController | null = null;

  constructor(hooks: EngineHooks) {
    this.hooks = hooks;
  }

  reset() {
    this.cancelled = false;
    this.controller?.abort();
    this.controller = null;
  }

  cancel() {
    this.cancelled = true;
    this.controller?.abort();
  }

  private endpoint(): { url: string; headers: Record<string, string> } {
    const s = this.hooks.getSettings();
    if (s.provider === "local") {
      return {
        url: `http://127.0.0.1:${s.localPort}/v1/chat/completions`,
        headers: { "content-type": "application/json" }
      };
    }
    const base = (s.baseUrl || "").replace(/\/+$/, "");
    return {
      url: `${base}/v1/chat/completions`,
      headers: { "content-type": "application/json", authorization: `Bearer ${s.apiKey}` }
    };
  }

  private async chat(messages: Msg[]): Promise<ChatResponse> {
    const s = this.hooks.getSettings();
    const preset = EFFORT_PRESETS[s.effort];
    const { url, headers } = this.endpoint();
    this.controller = new AbortController();
    const res = await fetch(url, {
      method: "POST",
      headers,
      signal: this.controller.signal,
      body: JSON.stringify({
        model: s.provider === "local" ? s.localModel : s.model,
        messages,
        temperature: preset.temperature,
        max_tokens: preset.maxTokens,
        stream: false
      })
    });
    if (!res.ok) throw new Error(`провайдер ответил ${res.status}`);
    const json = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: ChatResponse["usage"];
    };
    return { content: json.choices?.[0]?.message?.content ?? "", usage: json.usage };
  }

  async run(task: string, history: Msg[]): Promise<RunResult> {
    const preset = EFFORT_PRESETS[this.hooks.getSettings().effort];
    const messages: Msg[] = [{ role: "system", content: SYSTEM_PROMPT }, ...history, { role: "user", content: task }];
    const usage: Usage = { prompt: 0, completion: 0, total: 0 };
    let turns = 0;
    let toolCalls = 0;
    let finalText = "";
    const touched = new Set<string>();

    while (turns < preset.maxTurns && !this.cancelled) {
      turns++;
      const ev = publish({ kind: "model", label: `Думаю (ход ${turns})`, agentId: "main" });
      const reply = await this.chat(messages);
      completeActivity(ev.id, "ok", { ok: true, preview: `${reply.content.length} симв.`, ms: 0 });

      if (reply.usage) {
        usage.prompt += reply.usage.prompt_tokens ?? 0;
        usage.completion += reply.usage.completion_tokens ?? 0;
        usage.total += reply.usage.total_tokens ?? 0;
        this.hooks.onUsage({ ...usage });
      }

      const calls: ParsedCall[] = parseToolCalls(reply.content);
      const prose = stripCalls(reply.content).trim();
      if (prose) this.hooks.onTextDelta(prose);

      if (!calls.length) {
        finalText = visiblePrefix(reply.content).trim();
        break;
      }

      messages.push({ role: "assistant", content: reply.content });

      for (const call of calls) {
        if (this.cancelled) break;
        toolCalls++;
        const args = (call.args ?? {}) as Record<string, unknown>;
        const toolEv = publish({
          kind: "tool",
          label: `${call.tool}`,
          agentId: "main",
          status: "running",
          tool: { tool: call.tool, args }
        });
        const started = Date.now();
        try {
          const output = await this.execTool(call.tool, args, touched);
          completeActivity(toolEv.id, "ok", {
            ok: true,
            preview: output.slice(0, 400),
            ms: Date.now() - started
          });
          messages.push({ role: "user", content: `<tool_result>${output}</tool_result>` });
        } catch (e) {
          const msg = String(e instanceof Error ? e.message : e);
          completeActivity(toolEv.id, "error", { ok: false, preview: msg, ms: Date.now() - started });
          messages.push({ role: "user", content: `<tool_error>${msg}</tool_error>` });
        }
      }
    }

    if (this.hooks.getSettings().mode === "swarm") {
      const workers: SwarmWorker[] = [
        { id: "w1", agent: "architect", task, status: "done", progress: 100 }
      ];
      this.hooks.onWorkers(workers);
    }

    this.hooks.onTouched([...touched]);
    return {
      text: finalText || visiblePrefix("").trim() || this.lastProse(messages),
      turns,
      toolCalls,
      usage,
      workers: [],
      plan: []
    };
  }

  private lastProse(messages: Msg[]): string {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "assistant") {
        const p = stripCalls(m.content).trim();
        if (p) return p;
      }
    }
    return "";
  }

  private async execTool(name: string, args: Record<string, unknown>, touched: Set<string>): Promise<string> {
    const root = this.hooks.getRoot();
    const path = String(args.path ?? args.file ?? "");
    switch (name) {
      case "list_dir": {
        const items = await api.listDir(root, path || root);
        return items.map((i) => `${i.is_dir ? "d" : "-"} ${i.path}`).join("\n") || "(пусто)";
      }
      case "read_file":
        return api.readFile(root, path);
      case "write_file": {
        const content = String(args.content ?? "");
        await api.writeFile(root, path, content);
        touched.add(path);
        return `записано ${content.length} символов в ${path}`;
      }
      case "search_files": {
        const hits = await api.searchFiles(root, path || root, String(args.query ?? ""), undefined, 50);
        return hits.map((h) => `${h.path}:${h.line}: ${h.preview}`).join("\n") || "ничего не найдено";
      }
      case "run_command": {
        const res = await fetch("/api/exec", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ cwd: root, command: String(args.command ?? "") })
        }).catch(() => null);
        if (!res || !res.ok) return "терминал недоступен (нужен npm run bridge или desktop-сборка)";
        const out = (await res.json()) as { stdout?: string; stderr?: string };
        return (out.stdout || "") + (out.stderr || "");
      }
      case "ask_user": {
        const q: PendingQuestion = {
          id: `q-${Date.now()}`,
          question: String(args.question ?? args.text ?? "Разрешить это действие?"),
          detail: args.detail ? String(args.detail) : undefined
        };
        this.hooks.onQuestion(q);
        const answer = await new Promise<boolean>((resolve) => {
          const onAns = (e: Event) => {
            const detail = (e as CustomEvent<{ id: string; answer: boolean }>).detail;
            if (detail?.id === q.id) {
              window.removeEventListener("infinitycoder:answer", onAns);
              resolve(detail.answer);
            }
          };
          window.addEventListener("infinitycoder:answer", onAns);
        });
        this.hooks.onQuestion(null);
        return answer ? "пользователь подтвердил" : "пользователь отказал";
      }
      default:
        throw new Error(`неизвестный инструмент: ${name}`);
    }
  }
}

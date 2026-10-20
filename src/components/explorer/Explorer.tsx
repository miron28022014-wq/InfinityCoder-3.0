import { useEffect, useState } from "react";
import { Icon, type IconName } from "../../icons";
import { Btn } from "../ui";
import { useStore } from "../../hooks/useStore";
import { openFolder, patchSettings, searchInProject, toggleLeft } from "../../store";
import type { SidebarTab } from "../../types";
import { FileTreePanel, ExplorerActions } from "./FileTree";
import { AgentsPanel, MemoryPanel } from "./Panels";

const TABS: Array<{ id: SidebarTab; icon: IconName; label: string }> = [
  { id: "files", icon: "stack", label: "Файлы" },
  { id: "agents", icon: "swarm", label: "Агенты" },
  { id: "memory", icon: "memory", label: "Память" }
];

export function Explorer() {
  const root = useStore(s => s.root);
  const tab = useStore(s => s.settings.sidebarTab);
  const collapsed = useStore(s => s.leftCollapsed);
  const query = useStore(s => s.fileQuery);
  const info = useStore(s => s.info);

  if (collapsed) {
    return (
      <aside className="flex h-full w-11 shrink-0 flex-col items-center gap-2 border-r border-line bg-surface py-2">
        <Btn icon="panelLeft" tip="Открыть панель" onClick={toggleLeft} />
        <span className="ic-grad-text select-none text-[11px] font-semibold [writing-mode:vertical-rl]">
          {root ? root.split(/[\\/]/).pop() : "Проект"}
        </span>
      </aside>
    );
  }

  if (!root) {
    return (
      <aside className="flex h-full shrink-0 flex-col items-center justify-center gap-4 overflow-hidden border-r border-line bg-surface px-5 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl border border-line bg-raised text-ink-mute">
          <Icon name="folder" size={20} />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-medium text-ink">Проект не открыт</p>
          <p className="mx-auto mt-1 max-w-[min(30ch,100%)] text-[11.5px] leading-relaxed text-ink-mute">
            Агенту нужна папка: он будет читать файлы, запускать команды и вести память проекта.
          </p>
        </div>
        <Btn variant="primary" icon="folder" onClick={() => void openFolder()}>
          Выбрать папку
        </Btn>
      </aside>
    );
  }

  return (
    <aside className="flex h-full shrink-0 flex-col border-r border-line bg-surface">
      {/* project header */}
      <div className="flex h-11 shrink-0 items-center gap-1.5 border-b border-line px-2.5">
        <Icon name="folder" size={13} className="shrink-0 text-accent" />
        <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold tracking-tight text-ink" title={root}>
          {root.split(/[\\/]/).pop()}
        </span>
        <ExplorerActions />
        <Btn icon="panelLeft" tip="Свернуть панель" onClick={toggleLeft} />
      </div>

      {/* tabs — one control, not three buttons */}
      <div className="flex shrink-0 items-center gap-0.5 border-b border-line px-1.5 py-1">
        <div className="flex flex-1 gap-0.5">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => patchSettings({ sidebarTab: t.id })}
              className="relative flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-[11.5px] font-medium transition-all duration-200"
              style={{
                background: tab === t.id ? "rgb(var(--ic-accent) / 0.13)" : "transparent",
                color: tab === t.id ? "rgb(var(--ic-accent))" : "rgb(var(--ic-ink-mute))"
              }}
            >
              <Icon name={t.icon} size={12} />
              {t.label}
              {t.id === "memory" && info.memories > 0 && (
                <span className="tabular text-[10px] opacity-70">{info.memories}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* search — only for the files tab */}
      {tab === "files" && (
        <div className="flex shrink-0 items-center gap-1.5 border-b border-line px-2 py-1.5">
          <div className="relative flex-1">
            <Icon name="search" size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-ink-mute" />
            <input
              className="ic-input h-7 pl-7 text-[12px]"
              value={query}
              onChange={e => searchInProject(e.target.value)}
              placeholder="Поиск по проекту…"
            />
          </div>
          {query && (
            <Btn
              size="sm"
              icon="x"
              tip="Очистить"
              onClick={() => searchInProject("")}
            />
          )}
        </div>
      )}

      {/* body */}
      <div className="min-h-0 flex-1">
        {tab === "files" && <FileTreePanel />}
        {tab === "agents" && <AgentsPanel />}
        {tab === "memory" && <MemoryPanel />}
      </div>

      {/* project stats */}
      <div className="flex shrink-0 items-center gap-2 border-t border-line px-2.5 py-1.5 text-[10.5px] text-ink-mute">
        <span className="flex items-center gap-1">
          <Icon name="file" size={10} />
          {info.files}
        </span>
        {info.symbols > 0 && (
          <span className="flex items-center gap-1">
            <Icon name="hash" size={10} />
            {info.symbols}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Icon name="memory" size={10} />
          {info.memories}
        </span>
        {info.is_repo && (
          <span className="ml-auto flex items-center gap-1" style={{ color: "rgb(var(--ic-ok))" }}>
            <Icon name="branch" size={10} />
            git
          </span>
        )}
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ *
 * Resizer
 * ------------------------------------------------------------------ */

export function useResizer(
  value: number,
  onChange: (v: number) => void,
  opts: { min: number; max: number; invert?: boolean }
) {
  const [dragging, setDragging] = useState(false);
  const start = { x: 0, v: 0 };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => {
      const delta = opts.invert ? start.x - e.clientX : e.clientX - start.x;
      onChange(Math.min(opts.max, Math.max(opts.min, start.v + delta)));
    };
    const onUp = () => setDragging(false);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dragging]);

  return {
    dragging,
    onPointerDown: (e: React.PointerEvent) => {
      start.x = e.clientX;
      start.v = value;
      setDragging(true);
    }
  };
}

/**
 * Secondary Explorer tabs: swarm agents and the project memory ledger.
 */
import { useState } from "react";
import { Icon } from "../../icons";
import { Btn, Empty, Input } from "../ui";
import { useStore } from "../../hooks/useStore";
import { AGENTS } from "../../lib/agents";
import { memory } from "../../store";

export function AgentsPanel() {
  const workers = useStore((s) => s.workers);
  const plan = useStore((s) => s.plan);
  return (
    <div className="agents-panel">
      {plan.length ? (
        <ol className="plan-list">
          {plan.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ol>
      ) : null}
      {workers.length === 0 ? (
        <Empty icon="swarm" title="Рой простаивает" hint="Агенты появятся, когда задача будет разбита на подзадачи." />
      ) : (
        workers.map((w) => {
          const agent = AGENTS.find((a) => a.id === w.agent) ?? AGENTS[0];
          return (
            <div key={w.id} className="worker-card">
              <span className="worker-tint" style={{ background: `rgb(${agent.tint} / 0.16)` }}>
                <Icon name="bot" size={14} />
              </span>
              <div className="worker-body">
                <b>{agent.name}</b>
                <p>{w.task}</p>
                <div className="worker-progress">
                  <div style={{ width: `${w.progress}%` }} />
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export function MemoryPanel() {
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState(() => memory.all());
  const root = useStore((s) => s.root);

  const reload = async (q = query) => {
    if (!root) return;
    setEntries(q.trim() ? await memory.search(q) : await memory.load());
  };

  return (
    <div className="memory-panel">
      <Input placeholder="Поиск по памяти…" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={() => void reload()} />
      {entries.length === 0 ? (
        <Empty icon="brain" title="Память пуста" hint="InfinityCoder записывает сюда выводы после каждого запуска." />
      ) : (
        entries.map((e) => (
          <div key={e.key} className="memory-entry">
            <b>{e.key}</b>
            <p>{e.description}</p>
            <Btn size="sm" variant="subtle" icon="trash" onClick={() => void memory.remove(e.key).then(() => reload())}>
              Забыть
            </Btn>
          </div>
        ))
      )}
    </div>
  );
}

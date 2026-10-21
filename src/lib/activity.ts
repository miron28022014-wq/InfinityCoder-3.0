/**
 * Activity bus.
 *
 * The engine emits fine-grained events (tool started / finished, model deltas)
 * while a run is in flight. The store subscribes once and mirrors them into
 * `state.activity`; components read the snapshot through `useStore`.
 */
import type { ActivityEvent } from "../types";

type Listener = (e: ActivityEvent) => void;

const listeners = new Set<Listener>();
let events: ActivityEvent[] = [];
let seq = 0;

export function subscribeActivity(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emit(e: ActivityEvent) {
  const idx = events.findIndex((x) => x.id === e.id);
  if (idx >= 0) events[idx] = e;
  else events = [...events.slice(-199), e];
  for (const fn of listeners) fn(e);
}

export function publish(
  init: Partial<ActivityEvent> & { kind: ActivityEvent["kind"]; label: string }
): ActivityEvent {
  const e: ActivityEvent = {
    id: init.id ?? `ev-${++seq}-${Date.now()}`,
    status: "running",
    ts: Date.now(),
    ...init
  } as ActivityEvent;
  emit(e);
  return e;
}

export function complete(
  id: string,
  status: "ok" | "error",
  result?: { ok: boolean; preview: string; ms: number }
): void {
  const prev = events.find((e) => e.id === id);
  if (!prev) return;
  emit({ ...prev, status, result: result ?? prev.result });
}

export function resetActivity(): void {
  events = [];
}

export function getActivities(): readonly ActivityEvent[] {
  return events;
}

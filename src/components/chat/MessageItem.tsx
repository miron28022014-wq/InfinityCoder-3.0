/** One rendered chat message with its tool-call trail. */
import type { ReactNode } from "react";
import { Icon } from "../../icons";
import { Kbd } from "../../ui";
import type { ActivityEvent, Message } from "../../types";

export function ActivityStream({
  items,
  onOpenFile
}: {
  items: ActivityEvent[];
  onOpenFile?: (path: string) => void;
}) {
  if (!items.length) return null;
  return (
    <ul className="activity-stream">
      {items.slice(-8).map((e) => (
        <li key={e.id} className={`activity activity-${e.status}`}>
          <Icon name={e.kind === "tool" ? "terminal" : e.kind === "error" ? "alert" : "sparkles"} size={12} />
          <span>{e.label}</span>
          {e.result?.preview ? (
            <code
              className="activity-preview"
              style={onOpenFile && e.tool?.args.path ? { cursor: "pointer" } : undefined}
              onClick={() => {
                const p = e.tool?.args.path;
                if (onOpenFile && typeof p === "string") onOpenFile(p);
              }}
            >
              {e.result.preview.slice(0, 90)}
            </code>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function MessageItem({
  message,
  streaming,
  isLast
}: {
  message: Message;
  /** Text currently being streamed for this message, if the run is live. */
  streaming?: boolean | string;
  isLast?: boolean;
}) {
  const isUser = message.role === "user";
  const text = typeof streaming === "string" ? streaming : message.content;
  const live = streaming === true || typeof streaming === "string";
  return (
    <article className={`msg msg-${message.role}${live ? " msg-live" : ""}${isLast ? " msg-last" : ""}`}>
      <header className="msg-head">
        <Icon name={isUser ? "user" : "bot"} size={14} />
        <span className="msg-role">{isUser ? "Вы" : "InfinityCoder"}</span>
        {message.stats ? (
          <Kbd>
            {message.stats.turns} ходов · {message.stats.toolCalls} вызовов
          </Kbd>
        ) : null}
      </header>
      <div className="msg-body">
        <p className="msg-text">{text}</p>
        {message.error ? <p className="msg-error">{message.error}</p> : null}
        {message.activity ? <ActivityStreamInline events={message.activity} /> : null}
      </div>
    </article>
  );
}

/** Per-message activity trail (no file-opening affordance needed here). */
function ActivityStreamInline({ events }: { events: ActivityEvent[] }): ReactNode {
  return <ActivityStream items={events} />;
}

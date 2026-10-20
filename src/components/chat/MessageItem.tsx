/**
 * One rendered chat message with its tool-call trail.
 */
import { Icon } from "../../icons";
import { Kbd } from "../ui";
import type { Message } from "../../types";

export function ActivityStream({ message }: { message: Message }) {
  const events = message.activity ?? [];
  if (!events.length) return null;
  return (
    <ul className="activity-stream">
      {events.slice(-8).map((e) => (
        <li key={e.id} className={`activity activity-${e.status}`}>
          <Icon name={e.kind === "tool" ? "terminal" : e.kind === "error" ? "alert" : "sparkles"} size={12} />
          <span>{e.label}</span>
          {e.result?.preview ? <code className="activity-preview">{e.result.preview.slice(0, 90)}</code> : null}
        </li>
      ))}
    </ul>
  );
}

export function MessageItem({ message, streaming }: { message: Message; streaming?: string }) {
  const isUser = message.role === "user";
  const text = streaming !== undefined ? streaming : message.content;
  return (
    <article className={`msg msg-${message.role}`}>
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
        <ActivityStream message={message} />
      </div>
    </article>
  );
}

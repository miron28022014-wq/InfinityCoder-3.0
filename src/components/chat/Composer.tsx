/**
 * Chat input: textarea + mode switch + send/stop.
 */
import { useRef, useState, type KeyboardEvent } from "react";
import { Icon } from "../../icons";
import { Btn, Kbd, Segmented } from "../ui";
import { useStore } from "../../hooks/useStore";
import { patchSettings, send, stop } from "../../store";
import type { Mode } from "../../types";

export function Composer() {
  const [text, setText] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const isRunning = useStore((s) => s.isRunning);
  const mode = useStore((s) => s.settings.mode);
  const canSend = useStore((s) => Boolean(s.root) && s.providerStatus === "ready");

  const submit = () => {
    const value = text.trim();
    if (!value || isRunning) return;
    setText("");
    void send(value);
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="composer">
      <Segmented<Mode>
        value={mode}
        onChange={(m) => patchSettings({ mode: m })}
        options={[
          { value: "agent", label: "Агент" },
          { value: "ask", label: "Вопрос" },
          { value: "swarm", label: "Рой" }
        ]}
      />
      <div className="composer-row">
        <textarea
          ref={ref}
          rows={3}
          placeholder={canSend ? "Опишите задачу… (Enter — отправить)" : "Откройте проект и настройте модель"}
          value={text}
          disabled={!canSend && !isRunning}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
        />
        {isRunning ? (
          <Btn variant="danger" icon="stop" onClick={() => stop()}>
            Стоп
          </Btn>
        ) : (
          <Btn variant="primary" icon="send" disabled={!text.trim() || !canSend} onClick={submit}>
            Отправить <Kbd>↵</Kbd>
          </Btn>
        )}
      </div>
    </div>
  );
}

import { useEffect, useLayoutEffect, useRef } from "react";
import { Icon } from "../../icons";
import { Btn, Kbd, StatusDot } from "../ui";
import { MessageItem, ActivityStream } from "./MessageItem";
import { Composer } from "./Composer";
import { useStore, shallowArray } from "../../hooks/useStore";
import {
  clearChat,
  openSettings,
  respond,
  revealLocation,
  togglePalette,
  toggleRight
} from "../../store";

export function ChatPanel() {
  const messages = useStore(s => s.messages, shallowArray);
  const streaming = useStore(s => s.streaming);
  const running = useStore(s => s.isRunning);
  const activity = useStore(s => s.activity, shallowArray);
  const question = useStore(s => s.question);
  const showActivity = useStore(s => s.settings.showActivity);
  const root = useStore(s => s.root);
  const providerStatus = useStore(s => s.providerStatus);
  const providerMessage = useStore(s => s.providerMessage);
  const collapsed = useStore(s => s.rightCollapsed);

  const scrollRef = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  // Follow the stream only while the user is already at the bottom.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || !pinned.current) return;
    el.scrollTo({ top: el.scrollHeight });
  }, [messages.length, streaming.length, activity.length]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      pinned.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  if (collapsed) {
    return (
      <aside className="flex h-full w-11 shrink-0 flex-col items-center gap-2 border-l border-line bg-surface py-2">
        <Btn icon="panelRight" tip="Открыть панель агента" onClick={toggleRight} />
        <span className="ic-grad-text select-none text-[11px] font-semibold [writing-mode:vertical-rl]">
          InfinityCoder
        </span>
      </aside>
    );
  }

  const streamingMessage = running ? messages[messages.length - 1] : undefined;

  return (
    <aside className="flex h-full shrink-0 flex-col border-l border-line bg-surface">
      {/* header */}
      <header className="flex h-11 shrink-0 items-center gap-2 border-b border-line px-3">
        <span className="grid h-6 w-6 place-items-center rounded-lg bg-accent/12 text-accent">
          <Icon name="infinity" size={13} strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12.5px] font-semibold tracking-tight text-ink">Агент</div>
          <div className="flex items-center gap-1.5 truncate text-[10.5px] text-ink-mute">
            <StatusDot status={providerStatus} size={5} />
            {providerMessage}
          </div>
        </div>
        <Btn icon="search" tip="Палитра команд  Ctrl+K" onClick={() => togglePalette(true)} />
        <Btn icon="settings" tip="Настройки" onClick={() => openSettings(true)} />
        <Btn icon="panelRight" tip="Свернуть панель" onClick={toggleRight} />
      </header>

      {/* transcript */}
      <div ref={scrollRef} className="ic-scroll relative flex-1 px-3 py-3">
        {messages.length === 0 ? (
          <Welcome />
        ) : (
          <div className="space-y-4">
            {messages.map((m, i) => (
              <MessageItem
                key={m.id}
                message={m}
                streaming={running && i === messages.length - 1 && m.role === "assistant"}
                isLast={i === messages.length - 1}
              />
            ))}
          </div>
        )}
        {running && streaming && streamingMessage && (
          <StreamingTail text={streaming} />
        )}
      </div>

      {showActivity && <ActivityStream items={activity} onOpenFile={p => void revealLocation(p)} />}

      {/* approval gate */}
      {question && <ApprovalCard />}

      <Composer
        disabled={!root || providerStatus !== "ready"}
        disabledReason={
          !root
            ? "Откройте проект, чтобы дать агенту доступ к файлам"
            : providerStatus === "error"
              ? `Провайдер недоступен: ${providerMessage}`
              : "Подключаюсь к модели…"
        }
      />

      {messages.length > 0 && (
        <button
          onClick={clearChat}
          className="flex items-center justify-center gap-1.5 border-t border-line py-1.5 text-[11px] text-ink-mute transition-colors hover:bg-raised/50 hover:text-ink-soft"
        >
          <Icon name="trash" size={11} />
          Очистить диалог
        </button>
      )}
    </aside>
  );
}

function StreamingTail({ text }: { text: string }) {
  return (
    <div className="mt-4 flex items-start gap-2.5">
      <span
        className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white"
        style={{ background: "var(--ic-grad)" }}
      >
        <Icon name="infinity" size={14} strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1 text-[13.5px] leading-relaxed text-ink-soft">
        {text}
        <span className="ic-caret" />
      </div>
    </div>
  );
}

function Welcome() {
  const root = useStore(s => s.root);
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-4 text-center">
      <span
        className="grid h-14 w-14 place-items-center rounded-2xl text-white"
        style={{
          background: "var(--ic-grad)",
          boxShadow: "0 12px 36px -12px rgb(var(--ic-accent) / 0.85)"
        }}
      >
        <Icon name="infinity" size={26} strokeWidth={2} />
      </span>
      <div>
        <h2 className="text-[15px] font-semibold tracking-tight text-ink">
          {root ? "Что делаем?" : "Сначала откройте проект"}
        </h2>
        <p className="mx-auto mt-1.5 max-w-[min(34ch,100%)] text-pretty text-[12px] leading-relaxed text-ink-mute">
          {root
            ? "Опишите задачу словами. Агент сам найдёт нужные файлы, прочитает их, внесёт правки и проверит результат."
            : "Агент работает с реальными файлами, терминалом и памятью проекта. Нужна папка, к которой у него есть доступ."}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10.5px] text-ink-mute">
        <Kbd>Ctrl</Kbd>
        <Kbd>K</Kbd>
        <span>команды</span>
        <span className="text-ink-mute/40">·</span>
        <Kbd>Ctrl</Kbd>
        <Kbd>↵</Kbd>
        <span>отправить</span>
        <span className="text-ink-mute/40">·</span>
        <Kbd>Esc</Kbd>
        <span>стоп</span>
      </div>
    </div>
  );
}

function ApprovalCard() {
  const question = useStore(s => s.question);
  if (!question) return null;
  return (
    <div className="ic-anim-pop shrink-0 border-t border-line bg-surface px-3 py-2.5" style={{ animationDuration: "220ms" }}>
      <div className="rounded-xl2 border border-warn/30 bg-warn/8 p-2.5">
        <div className="flex items-start gap-2">
          <Icon name="shield" size={14} className="mt-0.5 shrink-0 text-warn" />
          <div className="min-w-0 flex-1">
            <p className="text-[12.5px] font-medium text-ink">{question.question}</p>
            {question.detail && (
              <p className="ic-mono mt-1 max-h-24 overflow-auto whitespace-pre-wrap break-all text-[11px] leading-relaxed text-ink-mute">
                {question.detail}
              </p>
            )}
          </div>
        </div>
        <div className="mt-2.5 flex gap-1.5">
          <Btn variant="primary" size="sm" icon="check" onClick={() => respond(true)} className="flex-1">
            Разрешить
          </Btn>
          <Btn variant="outline" size="sm" icon="x" onClick={() => respond(false)} className="flex-1">
            Запретить
          </Btn>
        </div>
      </div>
    </div>
  );
}

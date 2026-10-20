import { Logo, Icon } from "../../icons";
import { Btn, StatusDot, Kbd } from "../ui";
import { useStore, shallow, formatBytes } from "../../hooks/useStore";
import {
  openFolder,
  openSettings,
  refreshDirs,
  refreshGit,
  saveAll,
  setTheme,
  toggleLeft,
  togglePalette,
  toggleRight
} from "../../store";

export function TitleBar() {
  const projectName = useStore(s => s.projectName);
  const root = useStore(s => s.root);
  const status = useStore(s => s.providerStatus);
  const message = useStore(s => s.providerMessage);
  const settings = useStore(s => s.settings, shallow);
  const git = useStore(s => s.git);
  const leftCollapsed = useStore(s => s.leftCollapsed);
  const dirtyTabs = useStore(s => s.tabs.filter(t => t.content !== t.saved).length);

  return (
    <header className="relative z-30 flex h-11 shrink-0 items-center gap-2 border-b border-line bg-surface px-2.5">
      <div className="flex items-center gap-2">
        <Logo size={22} />
        <span className="ic-grad-text text-[14px] font-bold tracking-tight">InfinityCoder</span>
        <span className="ic-badge" style={{ height: 18, fontSize: 9.5 }}>
          3.0
        </span>
      </div>

      <div className="mx-1 h-4 w-px bg-line" />

      <div className="flex min-w-0 items-center gap-1.5">
        <Btn
          size="sm"
          icon="folder"
          tip={root ? "Сменить проект" : "Открыть проект"}
          onClick={() => void openFolder()}
        />
        {root ? (
          <button
            onClick={() => void refreshDirs().then(refreshGit)}
            className="flex min-w-0 items-center gap-1.5 rounded-lg px-1.5 py-1 text-[12px] text-ink-soft transition-colors hover:bg-raised hover:text-ink"
            title={root}
          >
            <span className="truncate font-medium">{projectName}</span>
            {git && (
              <span className="flex items-center gap-1 text-[10.5px] text-ink-mute">
                <Icon name="branch" size={10} />
                {git.branch}
                {git.changed + git.untracked > 0 && (
                  <span style={{ color: "rgb(var(--ic-warn))" }}>•{git.changed + git.untracked}</span>
                )}
              </span>
            )}
          </button>
        ) : (
          <span className="text-[12px] text-ink-mute">проект не открыт</span>
        )}
      </div>

      <span className="flex-1" />

      {/* provider status — clickable, goes to settings */}
      <button
        onClick={() => openSettings(true)}
        className="flex items-center gap-1.5 rounded-full border border-line bg-raised/60 px-2.5 py-1 text-[11px] text-ink-soft transition-all duration-200 hover:border-line-strong hover:bg-raised"
        title="Настройки модели"
      >
        <StatusDot status={status} size={6} />
        <span className="max-w-[150px] truncate">{message}</span>
      </button>

      <div className="mx-0.5 h-4 w-px bg-line" />

      {dirtyTabs > 0 && (
        <Btn size="sm" icon="save" tip="Сохранить всё  Ctrl+K S" onClick={() => void saveAll()}>
          {dirtyTabs}
        </Btn>
      )}

      <Btn size="sm" icon="search" tip="Палитра команд  Ctrl+K" onClick={() => togglePalette(true)} />
      <Btn
        size="sm"
        icon={settings.theme === "dark" ? "moon" : "sun"}
        tip={settings.theme === "dark" ? "Светлая тема" : "Тёмная тема"}
        onClick={() => setTheme(settings.theme === "dark" ? "light" : "dark")}
      />
      <Btn size="sm" icon="settings" tip="Настройки" onClick={() => openSettings(true)} />
      <Btn size="sm" icon="panelLeft" tip="Проводник" onClick={toggleLeft} active={!leftCollapsed} />
      <Btn size="sm" icon="panelRight" tip="Панель агента" onClick={toggleRight} />
    </header>
  );
}

/* ================================================================== *
 * Status bar
 * ================================================================== */

export function StatusBar() {
  const running = useStore(s => s.isRunning);
  const usage = useStore(s => s.usage);
  const root = useStore(s => s.root);
  const git = useStore(s => s.git);
  const settings = useStore(s => s.settings, shallow);
  const info = useStore(s => s.info);
  const workers = useStore(s => s.workers);

  return (
    <footer className="flex h-6 shrink-0 items-center gap-3 border-t border-line bg-surface px-2.5 text-[10.5px] text-ink-mute">
      {running && (
        <span className="flex items-center gap-1.5" style={{ color: "rgb(var(--ic-accent))" }}>
          <span className="ic-equalizer" style={{ height: 9 }}>
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>{workers.length ? `рой ${workers.length}` : "агент работает"}</span>
        </span>
      )}

      {git && (
        <button
          onClick={() => void refreshGit()}
          className="flex items-center gap-1 transition-colors hover:text-ink-soft"
          title="Обновить состояние git"
        >
          <Icon name="branch" size={10} />
          {git.branch}
          {git.ahead > 0 && <span style={{ color: "rgb(var(--ic-ok))" }}>↑{git.ahead}</span>}
          {git.behind > 0 && <span style={{ color: "rgb(var(--ic-danger))" }}>↓{git.behind}</span>}
          {git.staged > 0 && <span style={{ color: "rgb(var(--ic-accent))" }}>+{git.staged}</span>}
          {git.changed > 0 && <span style={{ color: "rgb(var(--ic-warn))" }}>~{git.changed}</span>}
          {git.untracked > 0 && <span>·{git.untracked}</span>}
        </button>
      )}

      {root && (
        <span className="flex items-center gap-1" title="Индексировано в памяти проекта">
          <Icon name="memory" size={10} />
          {info.files} файлов · {info.memories} записей
        </span>
      )}

      <span className="flex-1" />

      {usage.total > 0 && (
        <span className="flex items-center gap-1 tabular" title="Токены в этом сеансе">
          <Icon name="zap" size={10} />
          {usage.total.toLocaleString("ru-RU")}
        </span>
      )}

      <span className="flex items-center gap-1" title="Режим работы агента">
        <Icon name={settings.mode === "swarm" ? "swarm" : "bot"} size={10} />
        {settings.mode === "swarm" ? `рой ×${settings.swarmSize}` : "агент"} · {settings.effort}
      </span>

      {info.symbols > 0 && (
        <span className="tabular" title="Символов проиндексировано">
          {formatBytes(info.symbols)}
        </span>
      )}

      <span className="flex items-center gap-1">
        <Kbd>Ctrl</Kbd>
        <Kbd>K</Kbd>
      </span>
    </footer>
  );
}

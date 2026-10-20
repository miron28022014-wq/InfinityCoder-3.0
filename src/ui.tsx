/**
 * Shared UI primitives used across every panel.
 */
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from "react";
import { useEffect } from "react";
import { Icon, Logo, type IconName } from "./icons";

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger" | "subtle" | "outline";
  icon?: IconName;
  size?: "sm" | "md";
  /** Tooltip text (rendered as the native `title` attribute). */
  tip?: string;
  active?: boolean;
  /** Shows a spinner and disables the button while true. */
  loading?: boolean;
};

export function Btn({ variant = "ghost", icon, size = "md", tip, active, loading, disabled, className = "", children, ...rest }: BtnProps) {
  return (
    <button
      type="button"
      title={tip}
      aria-pressed={active}
      disabled={disabled || loading}
      className={`btn btn-${variant} btn-${size}${active ? " btn-active" : ""} ${className}`.trim()}
      {...rest}
    >
      {loading ? <Spinner size={size === "sm" ? 13 : 15} /> : icon ? <Icon name={icon} size={size === "sm" ? 13 : 15} /> : null}
      {children}
    </button>
  );
}

export function StatusDot({ status, size }: { status: "ready" | "error" | "checking" | "offline" | "idle"; size?: number }) {
  return <span className={`status-dot status-${status}`} style={size ? { width: size, height: size } : undefined} aria-label={status} />;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="kbd">{children}</kbd>;
}

export function Spinner({ size = 14 }: { size?: number }) {
  return (
    <svg className="spinner" width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeDasharray="42 14" strokeLinecap="round" />
    </svg>
  );
}

export function Empty({ icon = "folder", title, hint }: { icon?: IconName; title: string; hint?: string }) {
  return (
    <div className="empty">
      <Icon name={icon} size={28} />
      <p className="empty-title">{title}</p>
      {hint ? <p className="empty-hint">{hint}</p> : null}
    </div>
  );
}

export function Dialog({
  title,
  onClose,
  children,
  wide,
  open = true,
  icon,
  width,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  open?: boolean;
  icon?: IconName;
  width?: number;
  footer?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="dialog-overlay" onMouseDown={onClose}>
      <div
        className={`dialog ${wide ? "dialog-wide" : ""}`.trim()}
        role="dialog"
        aria-label={title}
        style={width ? { maxWidth: width } : undefined}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="dialog-head">
          {icon ? <Icon name={icon} size={18} /> : <Logo size={18} />}
          <h2>{title}</h2>
          <Btn icon="x" variant="subtle" onClick={onClose} aria-label="Закрыть" />
        </header>
        <div className="dialog-body">{children}</div>
        {footer ? <footer className="dialog-foot">{footer}</footer> : null}
      </div>
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input className={`input ${className}`.trim()} {...rest} />;
}

export function Select<T extends string = string>({
  value,
  onChange,
  options,
  className = "",
}: {
  value: T;
  onChange: (v: T) => void;
  options: Array<{ value: T; label: string }> | Record<string, string>;
  className?: string;
}) {
  const list = Array.isArray(options)
    ? options
    : Object.entries(options).map(([value, label]) => ({ value, label }));
  return (
    <select className={`input select ${className}`.trim()} value={value} onChange={(e) => onChange(e.target.value as T)}>
      {list.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Segmented<T extends string = string>({
  value,
  onChange,
  options,
  items,
}: {
  value: T;
  onChange: (v: T) => void;
  /** The canonical prop name; `items` is accepted as an alias. */
  options?: Array<{ value: T; label: string; icon?: IconName }>;
  items?: Array<{ value: T; label: string; icon?: IconName }>;
}) {
  const list = options ?? items ?? [];
  return (
    <div className="segmented" role="tablist">
      {list.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          className={`segment ${value === o.value ? "active" : ""}`.trim()}
          onClick={() => onChange(o.value)}
        >
          {o.icon ? <Icon name={o.icon} size={13} /> : null}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      className={`switch ${checked ? "on" : ""}`.trim()}
      onClick={() => onChange(!checked)}
    >
      <span className="switch-thumb" />
      {label ? <span className="switch-label">{label}</span> : null}
    </button>
  );
}

export { Icon, Logo };
export type { IconName };

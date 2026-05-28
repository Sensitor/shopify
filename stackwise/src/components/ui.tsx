'use client';

import { type CSSProperties, type ReactNode } from 'react';

export function Card({
  children,
  className = '',
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      className={`rounded-2xl border border-border bg-panel ${className}`}
      style={style}
    >
      {children}
    </div>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-sm font-extrabold tracking-tight">{children}</h2>;
}

export function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-panel2 px-3 py-1.5 text-[13px]">
      <span className="text-muted">{label} </span>
      <b>{value}</b>
    </div>
  );
}

type BtnKind = 'accent' | 'ghost' | 'danger';

export function Btn({
  children,
  onClick,
  kind = 'accent',
  type = 'button',
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  kind?: BtnKind;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) {
  const kinds: Record<BtnKind, string> = {
    accent: 'bg-accent text-white hover:brightness-110',
    ghost: 'bg-transparent text-text border border-border hover:bg-panel2',
    danger: 'bg-transparent text-danger border border-danger hover:bg-danger/10',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-all active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed ${kinds[kind]}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
  width,
}: {
  label: string;
  children: ReactNode;
  width?: number;
}) {
  return (
    <div style={{ width }}>
      <label className="mb-1 block text-[11px] text-muted">{label}</label>
      {children}
    </div>
  );
}

export const inputClass =
  'w-full rounded-xl border border-border bg-panel2 px-3 py-2.5 text-sm text-text outline-none focus:border-accent';

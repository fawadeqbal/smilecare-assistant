'use client';

import type { BookingStatus, ConversationStatus, DocumentStatus } from '@smilecare/shared';

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[clamp(28px,3vw,38px)] leading-[1.1] font-extrabold tracking-[-0.03em]">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-ink-700">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'tonal' | 'danger' | 'ghost' | 'dark';
  size?: 'md' | 'sm';
};

const buttonStyles = {
  primary: 'bg-azure-600 text-white shadow-glow-sm hover:bg-azure-700 disabled:shadow-none',
  secondary: 'bg-white text-ink border-[1.5px] border-line-strong hover:border-night-900',
  tonal: 'bg-azure-50 text-azure-700 hover:bg-azure-100',
  danger: 'bg-white text-danger-ink border-[1.5px] border-danger-bg hover:bg-danger-bg',
  ghost: 'text-ink-700 hover:bg-pearl hover:text-ink',
  dark: 'bg-night-900 text-white hover:bg-night-800',
};

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-bold transition-colors disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-400 disabled:border-transparent ${
        size === 'sm' ? 'h-10 px-4 text-sm' : 'h-11 px-5 text-[15px]'
      } ${buttonStyles[variant]} ${className}`}
    />
  );
}

export function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-3xl bg-white shadow-rest ${className}`}>{children}</section>;
}

export function PanelHeader({ title, badge, action }: { title: string; badge?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 px-[22px] pt-5 pb-2.5">
      <div className="flex items-center gap-2.5">
        <h2 className="font-display text-xl font-bold tracking-[-0.01em]">{title}</h2>
        {badge}
      </div>
      {action}
    </div>
  );
}

const tone = {
  green: 'bg-success-bg text-success-ink',
  warning: 'bg-warning-bg text-warning-ink',
  amber: 'bg-amber-bg text-amber-ink',
  red: 'bg-danger-bg text-danger-ink',
  azure: 'bg-azure-50 text-azure-700',
  grey: 'bg-pearl text-ink-500',
};

export function Badge({ color, children, dot = false }: { color: keyof typeof tone; children: React.ReactNode; dot?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[13px] font-bold whitespace-nowrap ${tone[color]}`}>
      {dot && <span className="size-2 rounded-full bg-current opacity-80" />}
      {children}
    </span>
  );
}

export function ConversationBadge({ status }: { status: ConversationStatus }) {
  const map = { open: ['azure', 'Open'], handed_off: ['amber', 'Needs a person'], closed: ['grey', 'Resolved'] } as const;
  return <Badge color={map[status][0]}>{map[status][1]}</Badge>;
}

export function BookingBadge({ status }: { status: BookingStatus }) {
  const map = { pending: ['warning', 'To confirm'], confirmed: ['green', 'Confirmed'], cancelled: ['red', 'Cancelled'] } as const;
  return <Badge color={map[status][0]}>{map[status][1]}</Badge>;
}

export function DocumentBadge({ status }: { status: DocumentStatus }) {
  const map = { queued: ['grey', 'Queued'], processing: ['azure', 'Indexing'], ready: ['green', 'Ready'], failed: ['red', 'Failed'] } as const;
  return <Badge color={map[status][0]}>{map[status][1]}</Badge>;
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-md text-ink-500">{children}</div>}
    </div>
  );
}

export function ErrorNote({ error }: { error: unknown }) {
  return (
    <p role="alert" className="rounded-2xl bg-danger-bg px-4 py-3 text-sm text-danger-ink">
      {error instanceof Error ? error.message : 'Something went wrong.'}
    </p>
  );
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-6" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-5 animate-pulse rounded-full bg-pearl" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}

export function FilterPills<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: Array<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="group" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-full bg-white p-1 shadow-rest">
      {options.map((o) => (
        <button
          key={o.value || 'all'}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`h-9 rounded-full px-4 text-sm font-bold transition-colors ${
            value === o.value ? 'bg-night-900 text-white' : 'text-ink-500 hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm text-ink-500">
      <span>
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

export const fieldClass =
  'mt-1.5 h-[52px] w-full rounded-[14px] border-[1.5px] border-line-strong bg-white px-4 text-base text-ink outline-none transition-shadow focus:border-azure-600 focus:shadow-[0_0_0_4px_var(--color-azure-100)]';
export const textareaClass =
  'mt-1.5 w-full rounded-[14px] border-[1.5px] border-line-strong bg-white px-4 py-3 text-base text-ink outline-none transition-shadow focus:border-azure-600 focus:shadow-[0_0_0_4px_var(--color-azure-100)]';

'use client';

import type { BookingStatus, ConversationStatus, DocumentStatus } from '@smilecare/shared';

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-slate">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' };

export function Button({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const styles = {
    primary: 'bg-pine text-white hover:bg-brand',
    secondary: 'bg-white text-pine ring-1 ring-line hover:ring-brand/50',
    danger: 'bg-white text-danger ring-1 ring-red-200 hover:bg-red-50',
    ghost: 'text-slate hover:bg-mint hover:text-pine',
  }[variant];
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-[15px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${styles} ${className}`}
    />
  );
}

export function Panel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`rounded-2xl bg-white ring-1 ring-line ${className}`}>{children}</section>;
}

const tone = {
  green: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-900 ring-amber-200',
  red: 'bg-red-50 text-red-800 ring-red-200',
  grey: 'bg-slate-100 text-slate-700 ring-slate-200',
  blue: 'bg-sky-50 text-sky-800 ring-sky-200',
};

export function Badge({ color, children }: { color: keyof typeof tone; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[13px] font-bold ring-1 ${tone[color]}`}>{children}</span>;
}

export function ConversationBadge({ status }: { status: ConversationStatus }) {
  const map = { open: ['blue', 'Open'], handed_off: ['amber', 'Needs staff'], closed: ['grey', 'Closed'] } as const;
  return <Badge color={map[status][0]}>{map[status][1]}</Badge>;
}

export function BookingBadge({ status }: { status: BookingStatus }) {
  const map = { pending: ['amber', 'To confirm'], confirmed: ['green', 'Confirmed'], cancelled: ['grey', 'Cancelled'] } as const;
  return <Badge color={map[status][0]}>{map[status][1]}</Badge>;
}

export function DocumentBadge({ status }: { status: DocumentStatus }) {
  const map = { queued: ['grey', 'Queued'], processing: ['blue', 'Indexing'], ready: ['green', 'Ready'], failed: ['red', 'Failed'] } as const;
  return <Badge color={map[status][0]}>{map[status][1]}</Badge>;
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="px-6 py-14 text-center">
      <p className="font-display text-lg font-semibold">{title}</p>
      {children && <div className="mx-auto mt-1 max-w-md text-slate">{children}</div>}
    </div>
  );
}

export function ErrorNote({ error }: { error: unknown }) {
  return (
    <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">
      {error instanceof Error ? error.message : 'Something went wrong.'}
    </p>
  );
}

export function Skeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 p-6" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="h-5 animate-pulse rounded bg-mint" style={{ width: `${90 - i * 12}%` }} />
      ))}
    </div>
  );
}

export function Pager({ page, pageSize, total, onPage }: { page: number; pageSize: number; total: number; onPage: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-line px-5 py-3 text-sm text-slate">
      <span>
        Page {page} of {pages} · {total} total
      </span>
      <div className="flex gap-2">
        <Button variant="secondary" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button variant="secondary" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

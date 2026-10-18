'use client';

import type {
  AuthUser,
  Booking,
  BookingStatus,
  ConversationSummary,
  KnowledgeDocument,
  KnowledgeSearchHit,
  OverviewRange,
  OverviewStats,
  Paginated,
} from '@smilecare/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { ActivityChart, Sparkline } from '@/components/admin/activity-chart';
import { Button, EmptyState, ErrorNote, Panel, PanelHeader, Skeleton } from '@/components/admin/ui';
import { ArcDecoration, SunnyAvatar } from '@/components/brand';
import { BookIcon, CalendarIcon, ChatIcon, CheckIcon, ClockIcon, CloseIcon, FileIcon, UserIcon } from '@/components/icons';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/format';

const RANGES: OverviewRange[] = [7, 14, 30];

export default function OverviewPage() {
  const [range, setRange] = useState<OverviewRange>(14);
  const qc = useQueryClient();
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<AuthUser>('/auth/me') });
  const stats = useQuery({
    queryKey: ['overview', range],
    queryFn: () => api<OverviewStats>(`/analytics/overview?days=${range}`),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
  const waiting = useQuery({
    queryKey: ['conversations', 'handed_off', 1],
    queryFn: () => api<Paginated<ConversationSummary>>('/conversations?status=handed_off&pageSize=3'),
    refetchInterval: 30_000,
  });
  const requests = useQuery({
    queryKey: ['bookings', 'recent'],
    queryFn: () => api<Paginated<Booking>>('/bookings?pageSize=4'),
    refetchInterval: 30_000,
  });

  const refreshAll = () => {
    void qc.invalidateQueries({ queryKey: ['overview'] });
    void qc.invalidateQueries({ queryKey: ['bookings'] });
    void qc.invalidateQueries({ queryKey: ['conversations'] });
  };

  const s = stats.data;

  return (
    <div className="flex flex-col gap-[22px]">
      <Greeting name={me.data?.businessName} stats={s} />
      {stats.error && <ErrorNote error={stats.error} />}

      <Kpis stats={s} />

      <div className="flex flex-wrap items-stretch gap-4">
        <Panel className="flex min-w-0 flex-[2_1_560px] flex-col gap-[18px] p-[22px]">
          <div className="flex flex-wrap items-start justify-between gap-3.5">
            <div className="flex flex-col gap-2.5">
              <h2 className="font-display text-xl font-bold tracking-[-0.01em]">Activity</h2>
              <div className="flex flex-wrap gap-[22px]">
                <Legend color="bg-azure-600" label="Conversations" value={s?.daily.reduce((n, d) => n + d.conversations, 0)} />
                <Legend color="bg-aqua-500" label="Appointment requests" value={s?.daily.reduce((n, d) => n + d.bookings, 0)} />
              </div>
            </div>
            <div role="group" aria-label="Date range" className="flex gap-1 rounded-full bg-pearl p-1">
              {RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  aria-pressed={range === r}
                  onClick={() => setRange(r)}
                  className={`h-9 rounded-full px-3.5 text-sm font-bold transition-colors ${
                    range === r ? 'bg-white text-ink shadow-[0_1px_3px_rgba(11,16,32,0.14)]' : 'text-ink-500 hover:text-ink'
                  }`}
                >
                  {r} days
                </button>
              ))}
            </div>
          </div>
          {s ? <ActivityChart daily={s.daily} /> : <Skeleton rows={4} />}
        </Panel>

        <SunnyWeek stats={s} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2 [&>*]:min-w-0">
        <WaitingQueue data={waiting.data} loading={waiting.isLoading} total={s?.waiting.count} onChange={refreshAll} />
        <RequestsQueue data={requests.data} loading={requests.isLoading} pending={s?.bookings.pending} onChange={refreshAll} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2 [&>*]:min-w-0">
        <TopTopics stats={s} />
        <KnowledgeCard stats={s} />
      </div>
    </div>
  );
}

function Greeting({ name, stats }: { name?: string; stats?: OverviewStats }) {
  const now = new Date();
  const hour = now.getHours();
  const part = hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  const date = new Intl.DateTimeFormat('en', { weekday: 'long', day: 'numeric', month: 'long' }).format(now);

  let summary = 'Loading today’s numbers…';
  if (stats) {
    const w = stats.waiting.count;
    const p = stats.bookings.pending;
    const parts = [
      w ? `${w} ${w === 1 ? 'visitor is' : 'visitors are'} waiting for a person` : null,
      p ? `${p} appointment ${p === 1 ? 'request needs' : 'requests need'} confirming` : null,
    ].filter(Boolean);
    summary = parts.length ? `${parts.join(' and ')}.` : 'Nothing is waiting on you. Sunny has everything handled.';
    summary = summary.charAt(0).toUpperCase() + summary.slice(1);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm text-ink-500">{date}</span>
      <h1 className="font-display text-[clamp(30px,3.2vw,42px)] leading-[1.1] font-extrabold tracking-[-0.03em]">
        Good {part}, {name ? `${name.replace(/ (Dental )?Clinic$/i, '')} team` : 'team'}
      </h1>
      <p className="text-base text-ink-700">{summary}</p>
    </div>
  );
}

function delta(cur: number, prev: number): string {
  if (prev === 0) return cur === 0 ? 'No change' : 'New';
  const pct = Math.round(((cur - prev) / prev) * 100);
  return `${pct >= 0 ? '+' : ''}${pct}%`;
}

function Kpis({ stats: s }: { stats?: OverviewStats }) {
  const longest = s?.waiting.longestSince ? timeAgo(s.waiting.longestSince).replace(' ago', '') : null;
  const docsUpToDate = s ? s.documents.ready === s.documents.total : true;
  const cards = [
    {
      href: '/admin/conversations',
      label: 'Conversations',
      value: s?.week.conversations,
      suffix: '',
      spark: s?.sparks.conversations,
      badge: s ? delta(s.week.conversations, s.week.conversationsPrev) : '',
      note: 'vs last week',
      badgeClass: 'bg-success-bg text-success-ink',
      tile: 'bg-azure-50 text-azure-600',
      icon: ChatIcon,
      alert: false,
    },
    {
      href: '/admin/bookings',
      label: 'Appointment requests',
      value: s?.week.bookings,
      suffix: '',
      spark: s?.sparks.bookings,
      badge: s ? delta(s.week.bookings, s.week.bookingsPrev) : '',
      note: 'vs last week',
      badgeClass: 'bg-success-bg text-success-ink',
      tile: 'bg-aqua-50 text-aqua-700',
      icon: CalendarIcon,
      alert: false,
    },
    {
      href: '/admin/conversations?status=handed_off',
      label: 'Waiting for staff',
      value: s?.waiting.count,
      suffix: '',
      badge: longest ? `Longest ${longest}` : 'Nobody waiting',
      note: '',
      badgeClass: longest ? 'bg-amber-bg text-amber-ink' : 'bg-success-bg text-success-ink',
      tile: 'bg-amber-bg text-amber-ink',
      icon: UserIcon,
      alert: !!s?.waiting.count,
    },
    {
      href: '/admin/knowledge',
      label: 'Documents ready',
      value: s?.documents.ready,
      suffix: s ? ` of ${s.documents.total}` : '',
      badge: docsUpToDate ? 'Up to date' : `${(s?.documents.total ?? 0) - (s?.documents.ready ?? 0)} not ready`,
      note: s?.documents.lastIndexedAt ? `indexed ${timeAgo(s.documents.lastIndexedAt)}` : '',
      badgeClass: docsUpToDate ? 'bg-success-bg text-success-ink' : 'bg-warning-bg text-warning-ink',
      tile: 'bg-success-bg text-success',
      icon: BookIcon,
      alert: false,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(({ icon: Icon, ...k }) => (
        <Link
          key={k.label}
          href={k.href}
          className={`flex flex-col gap-2.5 rounded-[22px] border-2 bg-white px-5 pt-5 pb-4 text-ink no-underline shadow-rest transition-shadow hover:shadow-raised ${
            k.alert ? 'border-amber' : 'border-white'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-ink-700">{k.label}</span>
            <span className={`flex size-9 items-center justify-center rounded-xl ${k.tile}`}>
              <Icon size={18} />
            </span>
          </div>
          <div className="flex items-end justify-between gap-3">
            <span className="font-display text-[40px] leading-none font-extrabold tabular-nums">
              {k.value ?? '–'}
              <span className="text-xl font-semibold text-ink-500">{k.suffix}</span>
            </span>
            {k.spark && <Sparkline values={k.spark} />}
          </div>
          <span className="flex items-center gap-1.5 text-[13px] text-ink-500">
            {k.badge && <span className={`rounded-full px-2 font-bold whitespace-nowrap ${k.badgeClass}`}>{k.badge}</span>}
            {k.note}
          </span>
        </Link>
      ))}
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value?: number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="flex items-center gap-2 text-[13px] text-ink-700">
        <span className={`size-3 rounded ${color}`} />
        {label}
      </span>
      <span className="font-display text-[26px] font-bold tabular-nums">{value ?? '–'}</span>
    </div>
  );
}

function SunnyWeek({ stats: s }: { stats?: OverviewStats }) {
  const total = s?.week.conversations ?? 0;
  const resolved = s?.week.resolvedBySunny ?? 0;
  const pct = total ? Math.round((resolved / total) * 100) : 0;
  const circumference = 2 * Math.PI * 32;

  return (
    <section
      className="relative flex min-w-0 flex-[1_1_300px] flex-col gap-[18px] overflow-hidden rounded-3xl bg-night-950 p-6 text-white"
      style={{
        backgroundImage:
          'radial-gradient(360px circle at 100% 0%, rgba(51,85,255,0.6), transparent 70%), radial-gradient(260px circle at 0% 100%, rgba(47,224,200,0.18), transparent 70%)',
      }}
    >
      <ArcDecoration className="-right-[60px] -bottom-[90px] size-[300px]" stroke="#1B2340" width={20} spark />
      <div className="relative flex items-center gap-2.5">
        <SunnyAvatar size={36} light />
        <h2 className="font-display text-xl font-bold">Sunny this week</h2>
      </div>
      <div className="relative flex items-center gap-[18px]">
        <svg width="96" height="96" viewBox="0 0 80 80" role="img" aria-label={`${pct} percent answered without staff`}>
          <circle cx="40" cy="40" r="32" fill="none" stroke="#262E48" strokeWidth="9" />
          <circle
            cx="40"
            cy="40"
            r="32"
            fill="none"
            stroke="#2FE0C8"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${((pct / 100) * circumference).toFixed(1)} ${circumference.toFixed(1)}`}
            transform="rotate(-90 40 40)"
          />
          <text x="40" y="45" textAnchor="middle" fill="#FFFFFF" fontFamily="var(--font-onest)" fontWeight="800" fontSize="17">
            {s ? `${pct}%` : '–'}
          </text>
        </svg>
        <div className="flex flex-col gap-0.5">
          <span className="font-display text-[22px] leading-[1.2] font-bold">
            {resolved} of {total} chats
          </span>
          <span className="text-sm text-haze-200">answered without needing staff</span>
        </div>
      </div>
      <div className="relative grid grid-cols-2 gap-2.5">
        <div className="flex flex-col rounded-2xl bg-white/12 px-3.5 py-3">
          <span className="font-display text-2xl font-bold tabular-nums">{s?.week.visitorMessages ?? '–'}</span>
          <span className="text-[13px] text-haze-200">questions answered</span>
        </div>
        <div className="flex flex-col rounded-2xl bg-white/12 px-3.5 py-3">
          <span className="font-display text-2xl font-bold tabular-nums">{s?.week.bookings ?? '–'}</span>
          <span className="text-[13px] text-haze-200">appointments requested</span>
        </div>
      </div>
      <Link href="/admin/conversations" className="relative mt-auto self-start font-bold text-white underline-offset-4 hover:text-aqua-200">
        Read this week&apos;s transcripts
      </Link>
    </section>
  );
}

function WaitingQueue({
  data,
  loading,
  total,
  onChange,
}: {
  data?: Paginated<ConversationSummary>;
  loading: boolean;
  total?: number;
  onChange: () => void;
}) {
  const resolve = useMutation({
    mutationFn: (id: string) => api(`/conversations/${id}`, { method: 'PATCH', json: { status: 'closed' } }),
    onSuccess: onChange,
  });

  return (
    <Panel className="flex flex-col">
      <PanelHeader
        title="Waiting for a person"
        badge={!!total && <span className="rounded-full bg-amber-bg px-2 text-xs font-bold text-amber-ink">{total}</span>}
        action={
          <Link href="/admin/conversations?status=handed_off" className="text-sm font-bold">
            See all
          </Link>
        }
      />
      {resolve.error && (
        <div className="px-4">
          <ErrorNote error={resolve.error} />
        </div>
      )}
      {loading ? (
        <Skeleton rows={3} />
      ) : data?.items.length ? (
        <div className="flex flex-col gap-2.5 px-3.5 pt-1.5 pb-4">
          {data.items.map((c) => {
            const since = c.handedOffAt ?? c.updatedAt;
            const old = Date.now() - new Date(since).getTime() > 30 * 60_000;
            return (
              <article key={c.id} className="flex flex-col gap-3 rounded-[18px] border border-line p-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex size-10 flex-none items-center justify-center rounded-full bg-amber-bg text-sm font-bold text-amber-ink">
                    <UserIcon size={18} />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col leading-[1.35]">
                    <strong>Visitor {c.visitorId.slice(-6)}</strong>
                    <span className="truncate text-[13px] text-ink-500 first-letter:uppercase">{c.handoffReason ?? 'Asked for a person'}</span>
                  </div>
                  <span
                    className={`flex flex-none items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ${
                      old ? 'bg-amber-bg text-amber-ink' : 'bg-warning-bg text-warning-ink'
                    }`}
                  >
                    <ClockIcon size={13} strokeWidth={2.4} />
                    {timeAgo(since).replace(' ago', '')}
                  </span>
                </div>
                {c.lastVisitorMessage && (
                  <p className="rounded-[4px_14px_14px_14px] bg-pearl px-3 py-2.5 text-sm text-ink-700">“{c.lastVisitorMessage}”</p>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/conversations/${c.id}`}
                    className="inline-flex h-10 items-center rounded-full bg-azure-600 px-4 text-sm font-bold text-white no-underline hover:bg-azure-700 hover:text-white"
                  >
                    Open conversation
                  </Link>
                  <Button variant="secondary" size="sm" disabled={resolve.isPending} onClick={() => resolve.mutate(c.id)}>
                    Mark resolved
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState title="Nobody is waiting">When Sunny hands a visitor to your team, they’ll show up here.</EmptyState>
      )}
    </Panel>
  );
}

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** Turns free-text times like "next Tuesday afternoon" into a small day/part tile. */
function dayTile(preferred: string | null): { day: string; part: string } {
  const t = (preferred ?? '').toLowerCase();
  const day = DAYS.find((d) => t.includes(d) || new RegExp(`\\b${d.slice(0, 3)}\\b`).test(t));
  const part = /morning|\bam\b|a\.m\./.test(t) ? 'AM' : /afternoon|evening|\bpm\b|p\.m\.|after \d/.test(t) ? 'PM' : '';
  const label = day ? day.slice(0, 3) : t.includes('weekday') ? 'Wkdy' : t.includes('tomorrow') ? 'Tmrw' : t.includes('today') ? 'Today' : 'Any';
  return { day: label, part: part || '·' };
}

function RequestsQueue({
  data,
  loading,
  pending,
  onChange,
}: {
  data?: Paginated<Booking>;
  loading: boolean;
  pending?: number;
  onChange: () => void;
}) {
  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) => api<Booking>(`/bookings/${id}`, { method: 'PATCH', json: { status } }),
    onSuccess: onChange,
  });

  return (
    <Panel className="flex flex-col">
      <PanelHeader
        title="Appointment requests"
        badge={!!pending && <span className="rounded-full bg-warning-bg px-2 text-xs font-bold text-warning-ink">{pending} to confirm</span>}
        action={
          <Link href="/admin/bookings" className="text-sm font-bold">
            See all
          </Link>
        }
      />
      {update.error && (
        <div className="px-4">
          <ErrorNote error={update.error} />
        </div>
      )}
      {loading ? (
        <Skeleton rows={3} />
      ) : data?.items.length ? (
        <div className="flex flex-col px-3.5 pt-1 pb-3.5">
          {data.items.map((b) => {
            const tile = dayTile(b.preferredTime);
            const cancelled = b.status === 'cancelled';
            return (
              <div key={b.id} className="flex flex-wrap items-center gap-3 rounded-2xl px-2.5 py-3 hover:bg-pearl">
                <div
                  className={`flex h-14 w-[52px] flex-none flex-col items-center justify-center rounded-[14px] leading-[1.1] ${
                    cancelled ? 'bg-mist text-ink-400' : 'bg-azure-50 text-azure-700'
                  }`}
                  aria-hidden="true"
                >
                  <span className="text-[11px] font-bold tracking-[0.06em] uppercase">{tile.day}</span>
                  <span className="font-display text-[15px] font-bold">{tile.part}</span>
                </div>
                <div className="flex min-w-0 flex-[1_1_180px] flex-col gap-0.5">
                  <span className="flex flex-wrap items-center gap-2">
                    <strong>{b.patientName}</strong>
                    {b.service && <span className="rounded-full bg-azure-50 px-2 text-xs font-bold text-azure-700 first-letter:uppercase">{b.service}</span>}
                  </span>
                  <span className="text-[13px] text-ink-500">
                    {b.preferredTime ?? 'No time given'} · {b.phone} · {timeAgo(b.createdAt)}
                  </span>
                </div>
                {b.status === 'pending' ? (
                  <div className="flex gap-2">
                    <Button size="sm" disabled={update.isPending} onClick={() => update.mutate({ id: b.id, status: 'confirmed' })}>
                      <CheckIcon size={15} strokeWidth={2.6} />
                      Confirm
                    </Button>
                    <button
                      type="button"
                      aria-label={`Cancel request from ${b.patientName}`}
                      disabled={update.isPending}
                      onClick={() => update.mutate({ id: b.id, status: 'cancelled' })}
                      className="flex size-10 items-center justify-center rounded-full border-[1.5px] border-line-strong bg-white text-ink-700 hover:border-danger hover:text-danger-ink"
                    >
                      <CloseIcon size={16} strokeWidth={2.4} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`rounded-full px-3 py-1 text-[13px] font-bold ${
                        cancelled ? 'bg-danger-bg text-danger-ink' : 'bg-success-bg text-success-ink'
                      }`}
                    >
                      {cancelled ? 'Cancelled' : 'Confirmed'}
                    </span>
                    <button
                      type="button"
                      disabled={update.isPending}
                      onClick={() => update.mutate({ id: b.id, status: 'pending' })}
                      className="h-10 px-1 text-sm font-bold text-azure-600 hover:text-azure-700"
                    >
                      Undo
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <EmptyState title="No requests yet">When a visitor asks Sunny for an appointment, the request lands here for you to confirm.</EmptyState>
      )}
    </Panel>
  );
}

function TopTopics({ stats: s }: { stats?: OverviewStats }) {
  const top = s?.topTopics ?? [];
  const max = top[0]?.count ?? 1;
  return (
    <Panel className="flex flex-col gap-4 p-[22px]">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-xl font-bold tracking-[-0.01em]">What visitors ask about</h2>
        <span className="text-[13px] text-ink-500">Last 7 days</span>
      </div>
      {!s ? (
        <Skeleton rows={4} />
      ) : top.length ? (
        <ol className="flex flex-col gap-3.5">
          {top.map((t, i) => (
            <li key={t.label} className="flex flex-col gap-1.5">
              <div className="flex justify-between gap-3 text-sm">
                <span className="font-semibold">{t.label}</span>
                <span className="font-bold tabular-nums">{t.count}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-azure-50">
                <div className={`h-full rounded-full ${i === 0 ? 'bg-azure-600' : 'bg-[#7A90FF]'}`} style={{ width: `${(t.count / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-ink-500">Once visitors start chatting, you’ll see which topics come up most, based on the documents Sunny answers from.</p>
      )}
    </Panel>
  );
}

function KnowledgeCard({ stats: s }: { stats?: OverviewStats }) {
  const docs = useQuery({ queryKey: ['documents'], queryFn: () => api<Paginated<KnowledgeDocument>>('/knowledge/documents?pageSize=6') });
  const [query, setQuery] = useState('');
  const search = useMutation({
    mutationFn: (q: string) => api<KnowledgeSearchHit[]>('/knowledge/search', { method: 'POST', json: { query: q, limit: 1 } }),
  });
  const allReady = s && s.documents.total > 0 && s.documents.ready === s.documents.total;

  return (
    <Panel className="flex flex-col gap-3.5 p-[22px]">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl font-bold tracking-[-0.01em]">Knowledge base</h2>
        {s &&
          (allReady ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success-bg px-2.5 py-0.5 text-xs font-bold text-success-ink">
              <CheckIcon size={13} strokeWidth={3} />
              All {s.documents.total} ready
            </span>
          ) : (
            <span className="rounded-full bg-warning-bg px-2.5 py-0.5 text-xs font-bold text-warning-ink">
              {s.documents.ready} of {s.documents.total} ready
            </span>
          ))}
      </div>
      <ul className="flex flex-col">
        {docs.data?.items.map((d) => (
          <li key={d.id} className="flex items-center gap-3 border-b border-[#EEF0F6] py-2.5">
            <span className="flex size-[34px] flex-none items-center justify-center rounded-[10px] bg-pearl text-azure-600">
              <FileIcon size={17} />
            </span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold" title={d.title}>{d.title}</span>
            <span className="text-[13px] whitespace-nowrap text-ink-500">
              {d.chunkCount} {d.chunkCount === 1 ? 'section' : 'sections'}
            </span>
          </li>
        ))}
        {docs.data && !docs.data.items.length && (
          <li className="py-2 text-ink-500">
            <Link href="/admin/knowledge">Add your first document</Link> so Sunny has something to answer from.
          </li>
        )}
      </ul>
      <form
        className="flex items-center gap-2 rounded-full bg-pearl py-1 pr-1 pl-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) search.mutate(query);
        }}
      >
        <label htmlFor="kb-test" className="sr-only">
          Test a question
        </label>
        <input
          id="kb-test"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Test a question, e.g. Are you open on Sundays?"
          className="h-10 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-ink-500"
        />
        <Button type="submit" variant="dark" size="sm" disabled={search.isPending || !query.trim()}>
          Test
        </Button>
      </form>
      {search.data && (
        <p className="text-sm text-ink-700" role="status">
          {search.data[0] ? (
            <>
              Sunny would answer from <strong>{search.data[0].documentTitle}</strong> ({Math.round(search.data[0].score * 100)}% match).
            </>
          ) : (
            'No matching section. Add a document that answers this.'
          )}
        </p>
      )}
      {search.error && <ErrorNote error={search.error} />}
    </Panel>
  );
}

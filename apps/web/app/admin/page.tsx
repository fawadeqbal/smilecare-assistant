'use client';

import type { Booking, ConversationSummary, OverviewStats, Paginated } from '@smilecare/shared';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ActivityChart } from '@/components/admin/activity-chart';
import { EmptyState, ErrorNote, PageHeader, Panel, Skeleton } from '@/components/admin/ui';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/format';

export default function OverviewPage() {
  const stats = useQuery({ queryKey: ['overview'], queryFn: () => api<OverviewStats>('/analytics/overview'), refetchInterval: 30_000 });
  const waiting = useQuery({
    queryKey: ['conversations', 'handed_off', 1],
    queryFn: () => api<Paginated<ConversationSummary>>('/conversations?status=handed_off&pageSize=5'),
    refetchInterval: 30_000,
  });
  const pending = useQuery({
    queryKey: ['bookings', 'pending', 1],
    queryFn: () => api<Paginated<Booking>>('/bookings?status=pending&pageSize=5'),
    refetchInterval: 30_000,
  });

  const s = stats.data;

  return (
    <>
      <PageHeader title="Overview" description="What needs your attention, and how the assistant is doing." />

      {stats.error && <ErrorNote error={stats.error} />}

      <dl className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line ring-1 ring-line md:grid-cols-4">
        {[
          ['Conversations this week', s?.conversations.last7Days],
          ['Waiting for staff', s?.conversations.handedOff],
          ['Requests to confirm', s?.bookings.pending],
          ['Documents ready', s ? `${s.documents.ready} of ${s.documents.total}` : undefined],
        ].map(([label, value]) => (
          <div key={label as string} className="bg-white px-5 py-4">
            <dt className="text-sm text-slate">{label}</dt>
            <dd className="mt-1 font-display text-3xl font-bold tabular-nums">{value ?? '–'}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 xl:grid-cols-2">
        <Panel>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-display text-lg font-semibold">Waiting for a person</h2>
            <Link href="/admin/conversations?status=handed_off" className="text-sm font-bold text-brand hover:underline">
              See all
            </Link>
          </div>
          {waiting.isLoading ? (
            <Skeleton rows={3} />
          ) : waiting.data?.items.length ? (
            <ul className="divide-y divide-line">
              {waiting.data.items.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/conversations/${c.id}`} className="block px-5 py-3.5 hover:bg-porcelain">
                    <p className="line-clamp-1">{c.lastMessage ?? 'No messages'}</p>
                    <p className="mt-0.5 text-sm text-slate">
                      {c.messageCount} messages · {timeAgo(c.updatedAt)}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="Nobody is waiting">When the assistant hands a visitor to your team, they’ll show up here.</EmptyState>
          )}
        </Panel>

        <Panel>
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-display text-lg font-semibold">Appointment requests to confirm</h2>
            <Link href="/admin/bookings?status=pending" className="text-sm font-bold text-brand hover:underline">
              See all
            </Link>
          </div>
          {pending.isLoading ? (
            <Skeleton rows={3} />
          ) : pending.data?.items.length ? (
            <ul className="divide-y divide-line">
              {pending.data.items.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                  <div className="min-w-0">
                    <p className="font-bold">
                      {b.patientName}
                      {b.service && <span className="font-normal text-slate"> · {b.service}</span>}
                    </p>
                    <p className="text-sm text-slate">
                      {b.preferredTime ?? 'No time given'} · {b.phone}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm text-slate">{timeAgo(b.createdAt)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="All caught up">New appointment requests from the assistant will appear here.</EmptyState>
          )}
        </Panel>
      </div>

      <Panel className="mt-6 p-5">
        <h2 className="mb-4 font-display text-lg font-semibold">Last 14 days</h2>
        {s ? <ActivityChart daily={s.daily} /> : <Skeleton rows={3} />}
      </Panel>
    </>
  );
}

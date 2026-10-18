'use client';

import type { ConversationStatus, ConversationSummary, Paginated } from '@smilecare/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { ConversationBadge, EmptyState, ErrorNote, FilterPills, PageHeader, Pager, Panel, Skeleton } from '@/components/admin/ui';
import { SunnyAvatar } from '@/components/brand';
import { UserIcon } from '@/components/icons';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/format';

const filters: Array<{ value: ConversationStatus | ''; label: string }> = [
  { value: '', label: 'All' },
  { value: 'handed_off', label: 'Needs a person' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Resolved' },
];

function ConversationsList() {
  const params = useSearchParams();
  const router = useRouter();
  const status = (params.get('status') ?? '') as ConversationStatus | '';
  const [page, setPage] = useState(1);

  const q = useQuery({
    queryKey: ['conversations', status, page],
    queryFn: () => api<Paginated<ConversationSummary>>(`/conversations?page=${page}&pageSize=20${status ? `&status=${status}` : ''}`),
    placeholderData: keepPreviousData,
    refetchInterval: 20_000,
  });

  return (
    <>
      <div className="mb-4">
        <FilterPills
          label="Filter by status"
          options={filters}
          value={status}
          onChange={(v) => {
            setPage(1);
            router.replace(v ? `/admin/conversations?status=${v}` : '/admin/conversations');
          }}
        />
      </div>

      {q.error && <ErrorNote error={q.error} />}
      <Panel className="overflow-hidden">
        {q.isLoading ? (
          <Skeleton rows={6} />
        ) : q.data?.items.length ? (
          <>
            <ul className="divide-y divide-line">
              {q.data.items.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/conversations/${c.id}`} className="flex items-center gap-4 px-5 py-4 text-ink no-underline hover:bg-pearl">
                    <span
                      className={`flex size-10 flex-none items-center justify-center rounded-full ${
                        c.status === 'handed_off' ? 'bg-amber-bg text-amber-ink' : 'bg-azure-50 text-azure-600'
                      }`}
                    >
                      <UserIcon size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 font-semibold">{c.lastVisitorMessage ?? c.lastMessage ?? 'No messages yet'}</p>
                      <p className="mt-0.5 text-sm text-ink-500">
                        Visitor {c.visitorId.slice(-6)} · {c.messageCount} messages · {timeAgo(c.updatedAt)}
                        {c.status === 'handed_off' && c.handoffReason && <> · {c.handoffReason}</>}
                      </p>
                    </div>
                    <ConversationBadge status={c.status} />
                  </Link>
                </li>
              ))}
            </ul>
            <Pager page={page} pageSize={20} total={q.data.total} onPage={setPage} />
          </>
        ) : (
          <div className="flex flex-col items-center">
            <div className="pt-10">
              <SunnyAvatar size={48} />
            </div>
            <EmptyState title="No conversations here">
              Open the{' '}
              <Link href="/" target="_blank" className="font-bold">
                clinic website
              </Link>{' '}
              and ask Sunny a question to start one.
            </EmptyState>
          </div>
        )}
      </Panel>
    </>
  );
}

export default function ConversationsPage() {
  return (
    <>
      <PageHeader title="Conversations" description="Every chat with Sunny, newest activity first." />
      <Suspense>
        <ConversationsList />
      </Suspense>
    </>
  );
}

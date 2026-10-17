'use client';

import type { ConversationStatus, ConversationSummary, Paginated } from '@smilecare/shared';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { ConversationBadge, EmptyState, ErrorNote, PageHeader, Pager, Panel, Skeleton } from '@/components/admin/ui';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/format';

const filters: Array<{ value: ConversationStatus | ''; label: string }> = [
  { value: '', label: 'All' },
  { value: 'handed_off', label: 'Needs staff' },
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
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
      <div role="tablist" aria-label="Filter by status" className="mb-4 flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.value}
            role="tab"
            aria-selected={status === f.value}
            onClick={() => {
              setPage(1);
              router.replace(f.value ? `/admin/conversations?status=${f.value}` : '/admin/conversations');
            }}
            className={`rounded-full px-4 py-1.5 text-[15px] font-bold ring-1 transition-colors ${
              status === f.value ? 'bg-pine text-white ring-pine' : 'bg-white text-slate ring-line hover:text-pine'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {q.error && <ErrorNote error={q.error} />}
      <Panel>
        {q.isLoading ? (
          <Skeleton rows={6} />
        ) : q.data?.items.length ? (
          <>
            <ul className="divide-y divide-line">
              {q.data.items.map((c) => (
                <li key={c.id}>
                  <Link href={`/admin/conversations/${c.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-porcelain">
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1">{c.lastMessage ?? 'No messages yet'}</p>
                      <p className="mt-0.5 text-sm text-slate">
                        Visitor {c.visitorId.slice(-6)} · {c.messageCount} messages · started {timeAgo(c.createdAt)}
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
          <EmptyState title="No conversations here">
            Open the <Link href="/" target="_blank" className="font-bold text-brand underline">clinic website</Link> and ask the assistant a
            question to start one.
          </EmptyState>
        )}
      </Panel>
    </>
  );
}

export default function ConversationsPage() {
  return (
    <>
      <PageHeader title="Conversations" description="Every chat with the assistant, newest activity first." />
      <Suspense>
        <ConversationsList />
      </Suspense>
    </>
  );
}

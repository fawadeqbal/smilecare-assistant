'use client';

import type { ConversationDetail, ConversationStatus } from '@smilecare/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BookingBadge, Button, ConversationBadge, ErrorNote, Panel, Skeleton } from '@/components/admin/ui';
import { api } from '@/lib/api';
import { dateTime, shortRef } from '@/lib/format';

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['conversation', id], queryFn: () => api<ConversationDetail>(`/conversations/${id}`), refetchInterval: 15_000 });

  const setStatus = useMutation({
    mutationFn: (status: ConversationStatus) => api(`/conversations/${id}`, { method: 'PATCH', json: { status } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['conversation', id] });
      void qc.invalidateQueries({ queryKey: ['conversations'] });
      void qc.invalidateQueries({ queryKey: ['overview'] });
    },
  });

  const c = q.data;

  return (
    <>
      <Link href="/admin/conversations" className="text-sm font-bold text-brand hover:underline">
        All conversations
      </Link>
      <div className="mt-3 mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 font-display text-3xl font-bold tracking-tight">
            Conversation {c && <ConversationBadge status={c.status} />}
          </h1>
          {c && <p className="mt-1 text-slate">Started {dateTime(c.createdAt)} · visitor {c.visitorId.slice(-6)}</p>}
        </div>
        {c && (
          <div className="flex gap-2">
            {c.status !== 'closed' ? (
              <Button variant="secondary" disabled={setStatus.isPending} onClick={() => setStatus.mutate('closed')}>
                Mark as resolved
              </Button>
            ) : (
              <Button variant="secondary" disabled={setStatus.isPending} onClick={() => setStatus.mutate('open')}>
                Reopen
              </Button>
            )}
          </div>
        )}
      </div>

      {q.error && <ErrorNote error={q.error} />}
      {setStatus.error && <ErrorNote error={setStatus.error} />}

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <Panel className="p-5 sm:p-6">
          {!c ? (
            <Skeleton rows={6} />
          ) : (
            <ol className="space-y-5">
              {c.messages.map((m) => (
                <li key={m.id} className={m.role === 'user' ? 'flex justify-end' : ''}>
                  <div className={`max-w-[80%] ${m.role === 'user' ? 'text-right' : ''}`}>
                    <p className="mb-1 text-xs text-slate">
                      {m.role === 'user' ? 'Visitor' : 'Assistant'} · {dateTime(m.createdAt)}
                    </p>
                    <div
                      className={`inline-block rounded-2xl px-4 py-2.5 text-left whitespace-pre-wrap ${
                        m.role === 'user' ? 'bg-pine text-white' : 'bg-mint'
                      }`}
                    >
                      {m.content}
                    </div>
                    {m.sources.length > 0 && (
                      <p className="mt-1.5 text-xs text-slate">
                        Answered from: {Array.from(new Set(m.sources.map((s) => s.documentTitle))).join(', ')}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Panel>

        <Panel className="self-start p-5">
          <h2 className="font-display text-lg font-semibold">Appointment requests</h2>
          {c?.bookings.length ? (
            <ul className="mt-3 space-y-4">
              {c.bookings.map((b) => (
                <li key={b.id} className="border-t border-line pt-3 text-[15px]">
                  <div className="flex items-center justify-between">
                    <p className="font-bold">{b.patientName}</p>
                    <BookingBadge status={b.status} />
                  </div>
                  <p className="text-slate">{b.service ?? 'Service not specified'}</p>
                  <p className="text-slate">{b.preferredTime}</p>
                  <a href={`tel:${b.phone}`} className="font-bold text-brand">
                    {b.phone}
                  </a>
                  <p className="mt-1 text-xs text-slate">Ref {shortRef(b.id)}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-slate">None in this conversation.</p>
          )}
        </Panel>
      </div>
    </>
  );
}

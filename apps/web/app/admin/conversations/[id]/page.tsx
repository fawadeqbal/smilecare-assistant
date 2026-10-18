'use client';

import type { ConversationDetail, ConversationStatus } from '@smilecare/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { BookingBadge, Button, ConversationBadge, ErrorNote, Panel, Skeleton } from '@/components/admin/ui';
import { SunnyAvatar } from '@/components/brand';
import { BookIcon, PhoneIcon, UserIcon } from '@/components/icons';
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
      <Link href="/admin/conversations" className="text-sm font-bold">
        All conversations
      </Link>
      <div className="mt-3 mb-7 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="flex flex-wrap items-center gap-3 font-display text-[clamp(28px,3vw,38px)] leading-[1.1] font-extrabold tracking-[-0.03em]">
            Conversation {c && <ConversationBadge status={c.status} />}
          </h1>
          {c && (
            <p className="text-ink-700">
              Started {dateTime(c.createdAt)} · visitor {c.visitorId.slice(-6)}
            </p>
          )}
        </div>
        {c && (
          <Button
            variant="secondary"
            disabled={setStatus.isPending}
            onClick={() => setStatus.mutate(c.status === 'closed' ? 'open' : 'closed')}
          >
            {c.status === 'closed' ? 'Reopen' : 'Mark as resolved'}
          </Button>
        )}
      </div>

      {q.error && <ErrorNote error={q.error} />}
      {setStatus.error && <ErrorNote error={setStatus.error} />}

      {c?.status === 'handed_off' && (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-[20px] bg-amber-bg px-5 py-4">
          <span className="flex size-10 flex-none items-center justify-center rounded-full bg-amber-bg text-amber-ink">
            <UserIcon size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">This visitor is waiting for a person</p>
            <p className="text-sm text-ink-700">
              {c.handoffReason ? <>Reason: {c.handoffReason}. </> : null}
              {c.handedOffAt && <>Handed over {dateTime(c.handedOffAt)}.</>}
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1fr_340px]">
        <section className="rounded-3xl border border-line bg-white/60 p-5 sm:p-6">
          {!c ? (
            <Skeleton rows={6} />
          ) : (
            <ol className="flex flex-col gap-4">
              {c.messages.map((m) =>
                m.role === 'user' ? (
                  <li key={m.id} className="flex flex-col items-end gap-1">
                    <span className="text-xs text-ink-500">Visitor · {dateTime(m.createdAt)}</span>
                    <p className="max-w-[80%] rounded-[20px_20px_6px_20px] bg-azure-600 px-4 py-3 whitespace-pre-wrap text-white">{m.content}</p>
                  </li>
                ) : (
                  <li key={m.id} className="flex flex-col gap-1">
                    <span className="pl-[42px] text-xs text-ink-500">Sunny · {dateTime(m.createdAt)}</span>
                    <div className="flex items-end gap-2.5">
                      <SunnyAvatar size={32} />
                      <div className="max-w-[80%] rounded-[20px_20px_20px_6px] bg-white px-4 py-3 shadow-rest">
                        <p className="whitespace-pre-wrap">{m.content}</p>
                        {m.sources.length > 0 && (
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-ink-500">
                            <BookIcon size={14} />
                            From: {Array.from(new Set(m.sources.map((s) => s.documentTitle))).join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  </li>
                ),
              )}
            </ol>
          )}
        </section>

        <Panel className="self-start p-5">
          <h2 className="font-display text-xl font-bold">Appointment requests</h2>
          {c?.bookings.length ? (
            <ul className="mt-3 flex flex-col gap-4">
              {c.bookings.map((b) => (
                <li key={b.id} className="flex flex-col gap-1 border-t border-line pt-3 text-[15px]">
                  <div className="flex items-center justify-between gap-2">
                    <strong>{b.patientName}</strong>
                    <BookingBadge status={b.status} />
                  </div>
                  <span className="text-ink-500 first-letter:uppercase">{b.service ?? 'Service not specified'}</span>
                  <span className="text-ink-500">{b.preferredTime}</span>
                  <a href={`tel:${b.phone}`} className="inline-flex items-center gap-1.5 font-bold">
                    <PhoneIcon size={15} />
                    {b.phone}
                  </a>
                  <span className="text-xs text-ink-500">Ref {shortRef(b.id)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-ink-500">None in this conversation.</p>
          )}
        </Panel>
      </div>
    </>
  );
}

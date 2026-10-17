'use client';

import type { Booking, BookingStatus, Paginated } from '@smilecare/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { BookingBadge, Button, EmptyState, ErrorNote, PageHeader, Pager, Panel, Skeleton } from '@/components/admin/ui';
import { api } from '@/lib/api';
import { dateTime, shortRef } from '@/lib/format';

const filters: Array<{ value: BookingStatus | ''; label: string }> = [
  { value: 'pending', label: 'To confirm' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: '', label: 'All' },
];

function BookingsTable() {
  const params = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const status = (params.get('status') ?? 'pending') as BookingStatus | '';
  const [page, setPage] = useState(1);

  const q = useQuery({
    queryKey: ['bookings', status, page],
    queryFn: () => api<Paginated<Booking>>(`/bookings?page=${page}&pageSize=20${status ? `&status=${status}` : ''}`),
    placeholderData: keepPreviousData,
    refetchInterval: 20_000,
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: BookingStatus }) => api<Booking>(`/bookings/${id}`, { method: 'PATCH', json: { status } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['bookings'] });
      void qc.invalidateQueries({ queryKey: ['overview'] });
    },
  });

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Filter by status" className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.value || 'all'}
              role="tab"
              aria-selected={status === f.value}
              onClick={() => {
                setPage(1);
                router.replace(`/admin/bookings?status=${f.value}`);
              }}
              className={`rounded-full px-4 py-1.5 text-[15px] font-bold ring-1 transition-colors ${
                status === f.value ? 'bg-pine text-white ring-pine' : 'bg-white text-slate ring-line hover:text-pine'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <a href="/api/backend/bookings/export.csv" className="text-[15px] font-bold text-brand hover:underline">
          Download CSV
        </a>
      </div>

      {(q.error || update.error) && <ErrorNote error={q.error ?? update.error} />}

      <Panel className="overflow-hidden">
        {q.isLoading ? (
          <Skeleton rows={6} />
        ) : q.data?.items.length ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-[15px]">
                <thead className="border-b border-line bg-porcelain text-sm text-slate">
                  <tr>
                    <th className="px-5 py-3 font-bold">Patient</th>
                    <th className="px-5 py-3 font-bold">Service and time</th>
                    <th className="px-5 py-3 font-bold">Received</th>
                    <th className="px-5 py-3 font-bold">Status</th>
                    <th className="px-5 py-3 font-bold">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {q.data.items.map((b) => (
                    <tr key={b.id} className="align-top">
                      <td className="px-5 py-4">
                        <p className="font-bold">{b.patientName}</p>
                        <a href={`tel:${b.phone}`} className="text-brand">
                          {b.phone}
                        </a>
                        {b.email && <p className="text-sm text-slate">{b.email}</p>}
                      </td>
                      <td className="px-5 py-4">
                        <p>{b.service ?? 'Not specified'}</p>
                        <p className="text-sm text-slate">{b.preferredTime}</p>
                        {b.notes && <p className="mt-1 text-sm text-slate italic">“{b.notes}”</p>}
                      </td>
                      <td className="px-5 py-4 text-sm text-slate">
                        {dateTime(b.createdAt)}
                        <br />
                        Ref {shortRef(b.id)}
                        {b.conversationId && (
                          <>
                            {' · '}
                            <Link href={`/admin/conversations/${b.conversationId}`} className="font-bold text-brand hover:underline">
                              Chat
                            </Link>
                          </>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <BookingBadge status={b.status} />
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {b.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <Button disabled={update.isPending} onClick={() => update.mutate({ id: b.id, status: 'confirmed' })}>
                              Confirm
                            </Button>
                            <Button variant="danger" disabled={update.isPending} onClick={() => update.mutate({ id: b.id, status: 'cancelled' })}>
                              Cancel
                            </Button>
                          </div>
                        )}
                        {b.status !== 'pending' && (
                          <Button variant="ghost" disabled={update.isPending} onClick={() => update.mutate({ id: b.id, status: 'pending' })}>
                            Move back to “to confirm”
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager page={page} pageSize={20} total={q.data.total} onPage={setPage} />
          </>
        ) : (
          <EmptyState title={status === 'pending' ? 'No requests to confirm' : 'No appointment requests'}>
            When a visitor asks the assistant for an appointment, the request lands here for you to call and confirm.
          </EmptyState>
        )}
      </Panel>
    </>
  );
}

export default function BookingsPage() {
  return (
    <>
      <PageHeader
        title="Appointment requests"
        description="Requests the assistant collected. Call the patient to agree a time, then mark the request as confirmed."
      />
      <Suspense>
        <BookingsTable />
      </Suspense>
    </>
  );
}

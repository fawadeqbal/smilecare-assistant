'use client';

import type { Booking, BookingStatus, Paginated } from '@smilecare/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { BookingBadge, Button, EmptyState, ErrorNote, FilterPills, PageHeader, Pager, Panel, Skeleton } from '@/components/admin/ui';
import { CheckIcon, CloseIcon, UploadIcon } from '@/components/icons';
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
        <FilterPills
          label="Filter by status"
          options={filters}
          value={status}
          onChange={(v) => {
            setPage(1);
            router.replace(`/admin/bookings?status=${v}`);
          }}
        />
        <a
          href="/api/backend/bookings/export.csv"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-ocean-50 px-5 text-[15px] font-bold text-ocean-700 no-underline hover:bg-ocean-100"
        >
          <UploadIcon size={18} className="rotate-180" />
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
              <table className="w-full min-w-[780px] text-left text-[15px]">
                <thead className="border-b border-line text-sm text-ink-500">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold">Patient</th>
                    <th className="px-5 py-3.5 font-semibold">Service and time</th>
                    <th className="px-5 py-3.5 font-semibold">Received</th>
                    <th className="px-5 py-3.5 font-semibold">Status</th>
                    <th className="px-5 py-3.5">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {q.data.items.map((b) => (
                    <tr key={b.id} className="align-top hover:bg-cloud/60">
                      <td className="px-5 py-4">
                        <p className="font-bold">{b.patientName}</p>
                        <a href={`tel:${b.phone}`}>{b.phone}</a>
                        {b.email && <p className="text-sm text-ink-500">{b.email}</p>}
                      </td>
                      <td className="px-5 py-4">
                        {b.service && (
                          <span className="rounded-full bg-ocean-50 px-2 py-0.5 text-xs font-bold text-ocean-700 first-letter:uppercase">{b.service}</span>
                        )}
                        <p className="mt-1 text-sm text-ink-700">{b.preferredTime ?? 'No time given'}</p>
                        {b.notes && <p className="mt-1 text-sm text-ink-500 italic">“{b.notes}”</p>}
                      </td>
                      <td className="px-5 py-4 text-sm text-ink-500">
                        {dateTime(b.createdAt)}
                        <br />
                        Ref {shortRef(b.id)}
                        {b.conversationId && (
                          <>
                            {' · '}
                            <Link href={`/admin/conversations/${b.conversationId}`} className="font-bold">
                              Chat
                            </Link>
                          </>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <BookingBadge status={b.status} />
                      </td>
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        {b.status === 'pending' ? (
                          <div className="flex justify-end gap-2">
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
                          <button
                            type="button"
                            disabled={update.isPending}
                            onClick={() => update.mutate({ id: b.id, status: 'pending' })}
                            className="h-10 px-1 text-sm font-bold text-ocean-600 hover:text-ocean-700"
                          >
                            Move back to “to confirm”
                          </button>
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
            When a visitor asks Sunny for an appointment, the request lands here for you to call and confirm.
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
        description="Requests Sunny collected. Call the patient to agree a time, then mark the request as confirmed."
      />
      <Suspense>
        <BookingsTable />
      </Suspense>
    </>
  );
}

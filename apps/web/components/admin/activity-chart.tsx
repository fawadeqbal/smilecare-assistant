'use client';

import type { DailyActivity } from '@smilecare/shared';
import { useState } from 'react';

const weekday = new Intl.DateTimeFormat('en', { weekday: 'short' });
const dayMonth = new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric' });
const parse = (date: string) => new Date(`${date}T12:00:00`);

/**
 * Grouped bars (conversations in ocean, appointment requests in coral) with a tooltip
 * on hover or keyboard focus. Plain markup, no chart library.
 */
export function ActivityChart({ daily }: { daily: DailyActivity[] }) {
  const [active, setActive] = useState<number | null>(null);
  const range = daily.length;
  const peak = Math.max(...daily.map((d) => Math.max(d.conversations, d.bookings)), 1);
  const top = Math.max(4, Math.ceil(peak / 4) * 4);
  const every = range <= 7 ? 1 : range <= 14 ? 2 : 5;
  const height = (n: number) => (n === 0 ? '2px' : `${(n / top) * 100}%`);

  return (
    <div className="flex gap-2.5">
      <div aria-hidden="true" className="flex h-60 w-6 -translate-y-[7px] flex-col justify-between text-right text-xs text-ink-500 tabular-nums">
        <span>{top}</span>
        <span>{top / 2}</span>
        <span>0</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div
          className="relative grid h-60 items-stretch border-b border-line-strong bg-[linear-gradient(#EEF0F6_1px,transparent_1px)] bg-[length:100%_120px]"
          style={{ gridTemplateColumns: `repeat(${range}, minmax(0, 1fr))` }}
          onMouseLeave={() => setActive(null)}
        >
          {daily.map((d, i) => {
            const date = parse(d.date);
            const label = `${dayMonth.format(date)}: ${d.conversations} conversations, ${d.bookings} appointment requests`;
            const isActive = active === i;
            return (
              <button
                key={d.date}
                type="button"
                aria-label={label}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className={`relative flex cursor-default items-end justify-center gap-0.5 rounded-t-[10px] px-0.5 focus-visible:outline-offset-[-3px] ${
                  isActive ? 'bg-azure-50' : ''
                }`}
              >
                <span className="w-[40%] max-w-4 rounded-t bg-azure-600" style={{ height: height(d.conversations) }} />
                <span className="w-[40%] max-w-4 rounded-t bg-aqua-500" style={{ height: height(d.bookings) }} />
                {isActive && (
                  <span
                    className={`pointer-events-none absolute top-1.5 z-10 flex w-[168px] flex-col gap-1 rounded-[14px] bg-white px-3 py-2.5 text-left text-[13px] text-ink shadow-overlay ${
                      i < range / 2 ? 'left-1' : 'right-1'
                    }`}
                  >
                    <strong>
                      {weekday.format(date)}, {dayMonth.format(date)}
                    </strong>
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-[3px] bg-azure-600" />
                      <span className="flex-1">Conversations</span>
                      <strong className="tabular-nums">{d.conversations}</strong>
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="size-2.5 rounded-[3px] bg-aqua-500" />
                      <span className="flex-1">Requests</span>
                      <strong className="tabular-nums">{d.bookings}</strong>
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div aria-hidden="true" className="grid text-center text-xs whitespace-nowrap text-ink-500" style={{ gridTemplateColumns: `repeat(${range}, minmax(0, 1fr))` }}>
          {daily.map((d, i) => {
            const date = parse(d.date);
            const show = (range - 1 - i) % every === 0;
            return <span key={d.date}>{show ? (range <= 7 ? `${weekday.format(date)} ${date.getDate()}` : dayMonth.format(date)) : ''}</span>;
          })}
        </div>
      </div>
    </div>
  );
}

/** Tiny trend line for KPI cards. */
export function Sparkline({ values }: { values: number[] }) {
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => `${((i * 100) / Math.max(values.length - 1, 1)).toFixed(1)},${(31 - (v / max) * 27).toFixed(1)}`);
  return (
    <svg width="96" height="34" viewBox="0 0 100 34" preserveAspectRatio="none" aria-hidden="true">
      <polygon points={`0,34 ${pts.join(' ')} 100,34`} fill="var(--color-azure-50)" />
      <polyline points={pts.join(' ')} fill="none" stroke="var(--color-azure-600)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

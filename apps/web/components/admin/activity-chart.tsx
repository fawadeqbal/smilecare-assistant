'use client';

import type { OverviewStats } from '@smilecare/shared';

/** 14-day grouped bar chart of conversations and appointment requests. Plain SVG, no chart library. */
export function ActivityChart({ daily }: { daily: OverviewStats['daily'] }) {
  const max = Math.max(1, ...daily.map((d) => Math.max(d.conversations, d.bookings)));
  const width = 700;
  const height = 180;
  const pad = { top: 10, bottom: 26, left: 28, right: 4 };
  const slot = (width - pad.left - pad.right) / daily.length;
  const barW = Math.min(14, slot / 3);
  const y = (v: number) => pad.top + (height - pad.top - pad.bottom) * (1 - v / max);
  const ticks = Array.from(new Set([0, Math.ceil(max / 2), max]));

  return (
    <figure>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Conversations and appointment requests per day, last 14 days">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeDasharray={t ? '3 4' : undefined} />
            <text x={pad.left - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--color-slate)">
              {t}
            </text>
          </g>
        ))}
        {daily.map((d, i) => {
          const cx = pad.left + slot * i + slot / 2;
          const label = new Date(`${d.date}T00:00:00`).toLocaleDateString('en', { day: 'numeric', month: 'short' });
          return (
            <g key={d.date}>
              <title>{`${label}: ${d.conversations} conversations, ${d.bookings} appointment requests`}</title>
              <rect x={cx - barW - 1} y={y(d.conversations)} width={barW} height={y(0) - y(d.conversations)} rx="3" fill="var(--color-brand)" />
              <rect x={cx + 1} y={y(d.bookings)} width={barW} height={y(0) - y(d.bookings)} rx="3" fill="var(--color-citrus)" />
              {(i % 2 === 0 || i === daily.length - 1) && (
                <text x={cx} y={height - 8} textAnchor="middle" fontSize="11" fill="var(--color-slate)">
                  {label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex gap-5 text-sm text-slate">
        <span className="flex items-center gap-2">
          <i className="inline-block size-3 rounded-sm bg-brand" /> Conversations
        </span>
        <span className="flex items-center gap-2">
          <i className="inline-block size-3 rounded-sm bg-citrus" /> Appointment requests
        </span>
      </figcaption>
    </figure>
  );
}

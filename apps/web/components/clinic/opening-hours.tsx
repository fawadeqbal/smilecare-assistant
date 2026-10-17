'use client';

import { useEffect, useState } from 'react';
import { clinic } from '@/lib/clinic';

function clinicNow(): { dayIndex: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: clinic.timezone,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
  const dayIndex = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { dayIndex, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const to12h = (t: string) => {
  const h = Number(t.slice(0, 2));
  const m = t.slice(3);
  return `${h % 12 || 12}${m === '00' ? '' : `:${m}`} ${h < 12 ? 'AM' : 'PM'}`;
};

function status(dayIndex: number, minutes: number): string {
  const today = clinic.hours[dayIndex];
  if (today.open && today.close && minutes >= toMinutes(today.open) && minutes < toMinutes(today.close)) {
    return `Open now, until ${to12h(today.close)}`;
  }
  for (let i = 0; i < 7; i++) {
    const idx = (dayIndex + i) % 7;
    const d = clinic.hours[idx];
    if (!d.open) continue;
    if (i === 0 && minutes >= toMinutes(d.open)) continue;
    const when = i === 0 ? 'today' : i === 1 ? 'tomorrow' : d.day;
    return `Closed now. Opens ${when} at ${to12h(d.open)}`;
  }
  return 'Closed';
}

/** Weekly hours with today highlighted and a live open/closed line, computed in the clinic's time zone. */
export function OpeningHours() {
  const [now, setNow] = useState<{ dayIndex: number; minutes: number } | null>(null);
  useEffect(() => {
    setNow(clinicNow());
    const id = setInterval(() => setNow(clinicNow()), 60_000);
    return () => clearInterval(id);
  }, []);

  const isOpen = now ? status(now.dayIndex, now.minutes).startsWith('Open') : false;

  return (
    <div>
      <p className="flex items-center gap-2 font-bold" aria-live="polite">
        <span className={`inline-block size-2.5 rounded-full ${now ? (isOpen ? 'bg-emerald-500' : 'bg-citrus') : 'bg-line'}`} />
        {now ? status(now.dayIndex, now.minutes) : 'Checking today’s hours…'}
      </p>
      <dl className="mt-4 grid grid-cols-[1fr_auto] gap-y-1.5 text-[15px]">
        {[1, 2, 3, 4, 5, 6, 0].map((i) => {
          const d = clinic.hours[i];
          const today = now?.dayIndex === i;
          return (
            <div key={d.day} className={`contents ${today ? 'font-bold' : ''}`}>
              <dt className={today ? 'text-pine' : 'text-slate'}>{d.day}</dt>
              <dd className="text-right tabular-nums">{d.open && d.close ? `${to12h(d.open)} – ${to12h(d.close)}` : 'Closed'}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { clinic } from '@/lib/clinic';

interface ClinicStatus {
  isOpen: boolean;
  /** e.g. "Open today until 7 pm" or "Closed now · opens Monday at 9 am" */
  label: string;
}

const toMinutes = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3));
const toHuman = (t: string) => {
  const h = Number(t.slice(0, 2));
  const m = t.slice(3);
  return `${h % 12 || 12}${m === '00' ? '' : `:${m}`} ${h < 12 ? 'am' : 'pm'}`;
};

function clinicNow(): { dayIndex: number; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: clinic.timezone,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
  return {
    dayIndex: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')),
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

function statusAt(dayIndex: number, minutes: number): ClinicStatus {
  const today = clinic.hours[dayIndex];
  if (today.open && today.close && minutes >= toMinutes(today.open) && minutes < toMinutes(today.close)) {
    return { isOpen: true, label: `Open today until ${toHuman(today.close)}` };
  }
  for (let i = 0; i < 7; i++) {
    const day = clinic.hours[(dayIndex + i) % 7];
    if (!day.open) continue;
    if (i === 0 && minutes >= toMinutes(day.open)) continue;
    const when = i === 0 ? 'today' : i === 1 ? 'tomorrow' : day.day;
    return { isOpen: false, label: `Closed now · opens ${when} at ${toHuman(day.open)}` };
  }
  return { isOpen: false, label: 'Closed' };
}

/** Live open/closed status in the clinic's own time zone. Null until mounted, to avoid hydration mismatches. */
export function useClinicStatus(): ClinicStatus | null {
  const [status, setStatus] = useState<ClinicStatus | null>(null);
  useEffect(() => {
    const tick = () => {
      const { dayIndex, minutes } = clinicNow();
      setStatus(statusAt(dayIndex, minutes));
    };
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);
  return status;
}

export function OpenStatusPill({ suffix, short = false }: { suffix?: string; short?: boolean }) {
  const status = useClinicStatus();
  const open = status?.isOpen ?? true;
  const text = status ? (short ? (status.isOpen ? 'Open now' : 'Closed now') : status.label) : 'Checking today’s hours';
  return (
    <span
      aria-live="polite"
      className={`inline-flex items-center gap-2 self-start rounded-full px-3.5 py-1.5 text-sm font-bold ${
        open ? 'bg-success-bg text-success-ink' : 'bg-warning-bg text-warning-ink'
      }`}
    >
      <span className={`size-2 rounded-full ${open ? 'bg-success' : 'bg-coral-600'}`} />
      {text}
      {suffix && <span className="font-semibold opacity-80">· {suffix}</span>}
    </span>
  );
}

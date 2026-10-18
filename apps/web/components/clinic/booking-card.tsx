'use client';

import type { PublicBookingSummary } from '@smilecare/shared';
import { useEffect, useId, useRef, useState } from 'react';
import { Accent } from '@/components/brand';
import { AlertIcon, ArrowRightIcon, CheckIcon } from '@/components/icons';
import { bookingNeeds, bookingTimes, clinic } from '@/lib/clinic';
import { DEMO_WIDGET_KEY, PUBLIC_API_URL } from '@/lib/snippet';

type Need = (typeof bookingNeeds)[number];

/** Other parts of the page (e.g. "Book whitening") pre-select a need with this event. */
export const PREFILL_EVENT = 'smilecare:prefill-booking';
export function prefillBooking(need: Need) {
  window.dispatchEvent(new CustomEvent<Need>(PREFILL_EVENT, { detail: need }));
  document.getElementById('request')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

const chip = (on: boolean) =>
  on ? 'border-night-900 bg-night-900 text-white' : 'border-line-strong bg-white text-night-700 hover:border-night-900';
const input =
  'h-12 w-full min-w-0 rounded-[14px] border-[1.5px] border-line-strong bg-white px-3.5 text-[15px] text-ink outline-none placeholder:text-ink-400 focus-visible:border-azure-600 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-azure-100';

function listJoin(items: string[]) {
  return items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

/**
 * "Request a visit" card from the hero. It creates a real appointment request through
 * the public bookings endpoint, so it shows up in the staff dashboard like chat bookings do.
 */
export function BookingCard() {
  const ids = useId();
  const [need, setNeed] = useState<Need | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tried, setTried] = useState(false);
  const [sending, setSending] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState<PublicBookingSummary | null>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const onPrefill = (e: Event) => {
      setSent(null);
      setNeed((e as CustomEvent<Need>).detail);
    };
    window.addEventListener(PREFILL_EVENT, onPrefill);
    return () => window.removeEventListener(PREFILL_EVENT, onPrefill);
  }, []);

  useEffect(() => {
    if (sent) successRef.current?.focus();
  }, [sent]);

  const missing: string[] = [];
  if (need === null) missing.push('what you need');
  if (time === null) missing.push('a time');
  if (name.trim().length < 2) missing.push('your name');
  if (phone.replace(/\D/g, '').length < 7 || !/^[+()\-\s\d]+$/.test(phone.trim())) missing.push('a phone number');

  async function submit() {
    setServerError(null);
    if (missing.length) return setTried(true);
    setSending(true);
    try {
      const res = await fetch(`${PUBLIC_API_URL}/v1/public/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          widgetKey: DEMO_WIDGET_KEY,
          patientName: name.trim(),
          phone: phone.trim(),
          service: need,
          preferredTime: bookingTimes[time!].value,
        }),
      });
      if (res.status === 429) throw new Error('Too many requests just now. Please wait a minute, or call us.');
      if (!res.ok) throw new Error('We couldn’t send that. Please check your details, or call us.');
      setSent((await res.json()) as PublicBookingSummary);
      setTried(false);
    } catch (err) {
      setServerError(err instanceof TypeError ? 'We couldn’t reach the clinic. Please try again, or call us.' : (err as Error).message);
    } finally {
      setSending(false);
    }
  }

  function reset() {
    setSent(null);
    setNeed(null);
    setTime(null);
    setName('');
    setPhone('');
    setTried(false);
  }

  const error = serverError ?? (tried && missing.length ? `Please add ${listJoin(missing)}.` : null);

  return (
    <div className="relative z-[1] box-border w-full max-w-[450px] rounded-[30px] bg-white p-7 text-ink shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_40px_100px_-24px_rgba(0,0,0,0.6),0_0_80px_-20px_rgba(51,85,255,0.6)]">
      {sent ? (
        <div role="status" className="flex flex-col items-center gap-3.5 px-1 pt-3.5 pb-1 text-center">
          <span className="flex size-[76px] animate-pop items-center justify-center rounded-full bg-aqua-50 text-aqua-600 shadow-[0_0_0_8px_#F3FDFB]">
            <CheckIcon size={38} strokeWidth={2.6} />
          </span>
          <h2 ref={successRef} tabIndex={-1} className="text-[27px] leading-[1.2] font-bold tracking-[-0.03em] outline-none">
            Request sent, <Accent>{sent.patientName.split(/\s+/)[0]}</Accent>!
          </h2>
          <p className="text-ink-700">
            We&apos;ll call <strong>{phone.trim()}</strong> to confirm your visit.
          </p>
          <dl className="box-border flex w-full flex-col gap-2 rounded-[18px] bg-pearl px-4 py-3.5 text-[15px]">
            {[
              ['Visit', sent.service],
              ['Preferred time', sent.preferredTime],
              ['Where', 'Suite 210, Maple Grove'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3">
                <dt className="text-ink-500">{k}</dt>
                <dd className="font-bold">{v}</dd>
              </div>
            ))}
          </dl>
          <button type="button" onClick={reset} className="h-11 px-3 text-[15px] font-semibold text-azure-600 hover:text-azure-700">
            Make another request
          </button>
        </div>
      ) : (
        <form
          noValidate
          className="flex flex-col gap-[18px]"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-[25px] leading-[1.2] font-bold tracking-[-0.03em]">Request a visit</h2>
              <span className="text-sm text-ink-500">Takes under a minute. No payment needed.</span>
            </div>
            <span className="flex-none rounded-full bg-aqua-50 px-2.5 py-1 text-xs font-bold text-aqua-700">Free to ask</span>
          </div>

          <div role="group" aria-labelledby={`${ids}-need`} className="flex flex-col gap-2">
            <span id={`${ids}-need`} className="text-sm font-semibold">
              What do you need?
            </span>
            <div className="flex flex-wrap gap-2">
              {bookingNeeds.map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={need === n}
                  onClick={() => setNeed(n)}
                  className={`h-10 rounded-full border-[1.5px] px-3.5 text-sm font-medium transition-colors ${chip(need === n)}`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div role="group" aria-labelledby={`${ids}-when`} className="flex flex-col gap-2">
            <span id={`${ids}-when`} className="text-sm font-semibold">
              When suits you?
            </span>
            <div className="grid grid-cols-3 gap-2">
              {bookingTimes.map((t, i) => (
                <button
                  key={t.label}
                  type="button"
                  aria-pressed={time === i}
                  onClick={() => setTime(i)}
                  className={`flex flex-col items-center rounded-2xl border-[1.5px] px-1.5 py-2 leading-[1.25] transition-colors ${chip(time === i)}`}
                >
                  <span className="text-sm font-semibold">{t.label}</span>
                  <span className="text-xs opacity-75">{t.hours}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor={`${ids}-name`} className="text-sm font-semibold">
                Your name
              </label>
              <input
                id={`${ids}-name`}
                autoComplete="name"
                placeholder="Jane Doe"
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={input}
              />
            </div>
            <div className="flex min-w-0 flex-col gap-1.5">
              <label htmlFor={`${ids}-phone`} className="text-sm font-semibold">
                Phone
              </label>
              <input
                id={`${ids}-phone`}
                type="tel"
                autoComplete="tel"
                placeholder="(555) 000-0000"
                maxLength={25}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={input}
              />
            </div>
          </div>

          {error && (
            <span role="alert" className="flex items-center gap-2 rounded-xl bg-danger-bg px-3 py-2 text-sm text-danger-ink">
              <AlertIcon size={16} strokeWidth={2.2} />
              {error}
            </span>
          )}

          <button
            type="submit"
            disabled={sending}
            className="flex h-14 items-center justify-center gap-2.5 rounded-full bg-azure-600 text-[17px] font-semibold text-white shadow-glow-sm transition-[background-color,transform] hover:-translate-y-px hover:bg-azure-700 disabled:translate-y-0 disabled:opacity-70"
          >
            {sending ? 'Sending…' : 'Request appointment'}
            {!sending && <ArrowRightIcon size={18} strokeWidth={2.2} />}
          </button>
          <span className="text-center text-[13px] text-ink-500">
            We&apos;ll call you to confirm a time. Prefer to talk?{' '}
            <a href={clinic.phoneHref} className="font-semibold text-azure-600 hover:text-azure-700">
              {clinic.phone}
            </a>
          </span>
        </form>
      )}
    </div>
  );
}

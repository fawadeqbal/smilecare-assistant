'use client';

import { useState } from 'react';
import { AskChip } from '@/components/clinic/ask-assistant';
import { prefillBooking } from '@/components/clinic/booking-card';
import { CheckIcon, ShieldIcon, SparkleIcon, ToothRowIcon } from '@/components/icons';
import { treatments, type TreatmentTheme } from '@/lib/clinic';
import { TOOTH_PATH } from '@/components/brand';

const icons = { check: CheckIcon, sparkle: SparkleIcon, shield: ShieldIcon, teeth: ToothRowIcon };

const themes: Record<TreatmentTheme, { tile: string; sub: string; iconBg: string; ink: string; tooth: string; toothOpacity: number }> = {
  'azure-soft': { tile: 'bg-azure-50 text-ink', sub: 'text-ink-700', iconBg: 'bg-white', ink: 'text-azure-600', tooth: '#3355FF', toothOpacity: 0.08 },
  'aqua-soft': { tile: 'bg-aqua-50 text-ink', sub: 'text-night-700', iconBg: 'bg-white', ink: 'text-aqua-600', tooth: '#0E9C8A', toothOpacity: 0.1 },
  night: { tile: 'bg-night-950 text-white', sub: 'text-haze-200', iconBg: 'bg-night-800', ink: 'text-aqua-400', tooth: '#FFFFFF', toothOpacity: 0.06 },
  azure: { tile: 'bg-azure-600 text-white', sub: 'text-azure-100', iconBg: 'bg-white', ink: 'text-azure-600', tooth: '#FFFFFF', toothOpacity: 0.14 },
};

/** Segmented treatment picker: a big coloured tile plus that group's price list. */
export function TreatmentTabs({ heading }: { heading: React.ReactNode }) {
  const [index, setIndex] = useState(0);
  const group = treatments[index];
  const theme = themes[group.theme];
  const Icon = icons[group.icon];

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-6">
        {heading}
        <div role="group" aria-label="Treatment type" className="flex flex-wrap gap-1 rounded-full bg-pearl p-[5px]">
          {treatments.map((t, i) => (
            <button
              key={t.label}
              type="button"
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
              className={`h-11 rounded-full px-[18px] text-[15px] font-semibold transition-colors ${
                i === index ? 'bg-night-900 text-white' : 'text-ink-500 hover:text-ink'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(440px,100%),1fr))] items-stretch gap-5">
        <div
          className={`relative box-border flex min-h-[400px] flex-col gap-[18px] overflow-hidden rounded-[36px] p-[clamp(28px,4vw,48px)] ${theme.tile}`}
        >
          <svg aria-hidden="true" className="absolute -right-10 -bottom-[50px] size-[300px]" style={{ opacity: theme.toothOpacity }} viewBox="0 0 24 24">
            <path d={TOOTH_PATH} fill={theme.tooth} />
          </svg>
          <span className={`relative flex size-[60px] items-center justify-center rounded-[18px] ${theme.iconBg} ${theme.ink}`}>
            <Icon size={28} />
          </span>
          <h3 className="relative text-[clamp(32px,3.6vw,46px)] leading-none font-bold tracking-[-0.045em]">{group.label}</h3>
          <p className={`relative max-w-[420px] text-lg ${theme.sub}`}>{group.blurb}</p>
          <div className="relative mt-auto flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => prefillBooking(group.need)}
              className="flex h-[50px] items-center rounded-full bg-azure-600 px-[22px] font-semibold text-white shadow-[0_0_0_1px_rgba(255,255,255,0.25)] transition-colors hover:bg-azure-700"
            >
              Book {group.short}
            </button>
            <AskChip
              question={group.question}
              className="flex h-[50px] items-center gap-2 rounded-full bg-white px-5 font-semibold text-ink transition-transform hover:-translate-y-px disabled:opacity-70"
            >
              Ask Sunny
            </AskChip>
          </div>
        </div>

        <ul aria-live="polite" className="flex flex-col justify-center rounded-[36px] border border-line px-[clamp(18px,3vw,32px)] py-3">
          {group.items.map((item, j) => (
            <li
              key={item.name}
              className={`flex items-center justify-between gap-4 py-[22px] ${j < group.items.length - 1 ? 'border-b border-line' : ''}`}
            >
              <div className="flex flex-col gap-0.5">
                <span className="text-lg font-semibold tracking-[-0.01em]">{item.name}</span>
                <span className="text-sm text-ink-500">{item.note}</span>
              </div>
              <span
                className={`flex-none text-2xl font-bold tracking-[-0.03em] tabular-nums ${item.price === 'Free' ? 'text-aqua-700' : 'text-ink'}`}
              >
                {item.price}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

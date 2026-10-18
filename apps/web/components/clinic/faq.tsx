'use client';

import { useId, useState } from 'react';
import { MinusIcon, PlusIcon } from '@/components/icons';
import { faqs } from '@/lib/clinic';

/** FAQ accordion: one open at a time. */
export function Faq() {
  const id = useId();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="flex flex-col gap-2.5">
      {faqs.map((f, i) => {
        const isOpen = open === i;
        return (
          <div key={f.q} className={`rounded-[22px] border-[1.5px] bg-white transition-colors ${isOpen ? 'border-night-900' : 'border-white'}`}>
            <h3>
              <button
                type="button"
                id={`${id}-q${i}`}
                aria-expanded={isOpen}
                aria-controls={`${id}-a${i}`}
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-[18px] text-left text-ink"
              >
                <span className="text-[17px] font-semibold tracking-[-0.01em]">{f.q}</span>
                <span
                  className={`flex size-[34px] flex-none items-center justify-center rounded-full transition-colors ${
                    isOpen ? 'bg-night-900 text-white' : 'bg-pearl text-ink'
                  }`}
                >
                  {isOpen ? <MinusIcon size={16} strokeWidth={2.6} /> : <PlusIcon size={16} strokeWidth={2.6} />}
                </span>
              </button>
            </h3>
            <div id={`${id}-a${i}`} role="region" aria-labelledby={`${id}-q${i}`} hidden={!isOpen}>
              <p className="max-w-[560px] px-5 pb-5 text-ink-700">{f.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

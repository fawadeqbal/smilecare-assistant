'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    SmileCareWidget?: { open(): Promise<void>; close(): void; toggle(): void; ask(q: string): Promise<void> };
  }
}

export function useWidgetReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.SmileCareWidget) return setReady(true);
    const onReady = () => setReady(true);
    window.addEventListener('smilecare:ready', onReady);
    return () => window.removeEventListener('smilecare:ready', onReady);
  }, []);
  return ready;
}

/** Pill search box that hands the visitor's question straight to Sunny. */
export function AskSunnyBox({ id, examples }: { id: string; examples?: string[] }) {
  const ready = useWidgetReady();
  const [question, setQuestion] = useState('');

  const ask = (q: string) => {
    const text = q.trim();
    if (!text || !window.SmileCareWidget) return;
    void window.SmileCareWidget.ask(text);
    setQuestion('');
  };

  return (
    <div className="flex max-w-[520px] flex-col gap-3">
      <form
        className="flex items-center gap-2 rounded-full border-[1.5px] border-line bg-white py-1.5 pr-1.5 pl-5 shadow-[0_12px_28px_-10px_rgba(10,102,240,0.3)] focus-within:border-ocean-300"
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <label htmlFor={id} className="sr-only">
          Ask Sunny a question
        </label>
        <input
          id={id}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about prices, hours, insurance…"
          maxLength={300}
          className="h-[46px] min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-500"
        />
        <button
          type="submit"
          disabled={!ready || !question.trim()}
          className="h-[46px] rounded-full bg-ocean-600 px-[22px] text-[15px] font-bold text-white transition-colors hover:bg-ocean-700 disabled:opacity-60"
        >
          Ask Sunny
        </button>
      </form>
      {examples && (
        <div className="flex flex-wrap gap-2">
          {examples.map((q) => (
            <button
              key={q}
              type="button"
              disabled={!ready}
              onClick={() => ask(q)}
              className="h-11 rounded-full border-[1.5px] border-ocean-200 bg-white px-4 text-[15px] font-semibold text-ocean-700 transition-colors hover:bg-ocean-50 disabled:opacity-60"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Opens Sunny with an appointment request already sent. */
export function BookButton({ className, children }: { className?: string; children: React.ReactNode }) {
  const ready = useWidgetReady();
  return (
    <button
      type="button"
      disabled={!ready}
      onClick={() => void window.SmileCareWidget?.ask("I'd like to request an appointment")}
      className={className}
    >
      {children}
    </button>
  );
}

/** Opens Sunny without sending anything. */
export function OpenSunnyButton({ className, children }: { className?: string; children: React.ReactNode }) {
  const ready = useWidgetReady();
  return (
    <button type="button" disabled={!ready} onClick={() => void window.SmileCareWidget?.open()} className={className}>
      {children}
    </button>
  );
}

/** Sends a preset question to Sunny (used for the example chat's quick replies). */
export function AskChip({ question, className, children }: { question: string; className?: string; children: React.ReactNode }) {
  const ready = useWidgetReady();
  return (
    <button type="button" disabled={!ready} onClick={() => void window.SmileCareWidget?.ask(question)} className={className}>
      {children}
    </button>
  );
}

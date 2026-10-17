'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    SmileCareWidget?: { open(): Promise<void>; close(): void; toggle(): void; ask(q: string): Promise<void> };
  }
}

function useWidgetReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (window.SmileCareWidget) return setReady(true);
    const onReady = () => setReady(true);
    window.addEventListener('smilecare:ready', onReady);
    return () => window.removeEventListener('smilecare:ready', onReady);
  }, []);
  return ready;
}

const examples = ['How much is whitening?', 'Do you take Delta Dental?', 'Is there parking?'];

/** Hero search box that hands the visitor's question straight to the chat widget. */
export function AskAssistant() {
  const ready = useWidgetReady();
  const [question, setQuestion] = useState('');

  const ask = (q: string) => {
    const text = q.trim();
    if (!text || !window.SmileCareWidget) return;
    void window.SmileCareWidget.ask(text);
    setQuestion('');
  };

  return (
    <div className="max-w-xl">
      <form
        className="flex items-center gap-2 rounded-2xl bg-white p-2 pl-5 shadow-[0_1px_0_var(--color-line),0_18px_40px_-24px_rgba(14,59,51,.45)] ring-1 ring-line"
        onSubmit={(e) => {
          e.preventDefault();
          ask(question);
        }}
      >
        <label htmlFor="ask" className="sr-only">
          Ask our assistant a question
        </label>
        <input
          id="ask"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about prices, hours, insurance…"
          className="min-w-0 flex-1 bg-transparent py-2 text-[17px] outline-none placeholder:text-slate/70"
          maxLength={300}
        />
        <button
          type="submit"
          disabled={!ready || !question.trim()}
          className="rounded-xl bg-brand px-5 py-3 font-bold text-white transition-colors hover:bg-brand-dark disabled:opacity-50"
        >
          Ask Sunny
        </button>
      </form>
      <div className="mt-4 flex flex-wrap gap-2 text-[15px]">
        <span className="py-1 text-slate">Try:</span>
        {examples.map((q) => (
          <button
            key={q}
            type="button"
            disabled={!ready}
            onClick={() => ask(q)}
            className="rounded-full px-3 py-1 text-brand underline decoration-brand/30 underline-offset-4 hover:decoration-brand disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

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

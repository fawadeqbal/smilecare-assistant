'use client';

import type { AssistantIssue, AssistantStatus } from '@smilecare/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ExternalIcon } from '@/components/icons';
import { api } from '@/lib/api';
import { timeAgo } from '@/lib/format';

export function useAssistantStatus() {
  return useQuery({
    queryKey: ['assistant-status'],
    queryFn: () => api<AssistantStatus>('/assistant/status'),
    refetchInterval: 30_000,
  });
}

const CONSOLE = 'https://console.anthropic.com/';

/** What the owner sees, and exactly what to do about it. */
const ISSUES: Record<AssistantIssue, { short: string; title: (bot: string, model: string) => string; fix: (model: string) => React.ReactNode }> = {
  missing_key: {
    short: 'Needs an API key',
    title: (bot) => `${bot} can't answer visitors yet: no Claude API key is set`,
    fix: () => (
      <>
        Create a key in the Anthropic Console under <strong>API Keys</strong>, add it to <code>apps/api/.env</code> as{' '}
        <code>ANTHROPIC_API_KEY=sk-ant-…</code>, then restart the API. Until then visitors see a short note in the chat, and the
        website&apos;s booking form and this dashboard keep working.
      </>
    ),
  },
  invalid_key: {
    short: 'API key rejected',
    title: () => 'Claude rejected the API key',
    fix: () => (
      <>
        The key may be mistyped, revoked or from another workspace. Create a new key in the Anthropic Console, replace{' '}
        <code>ANTHROPIC_API_KEY</code> in <code>apps/api/.env</code> and restart the API.
      </>
    ),
  },
  no_credit: {
    short: 'Out of AI credit',
    title: () => 'Your Anthropic account has run out of credit',
    fix: () => (
      <>
        Add credit in the Anthropic Console under <strong>Settings → Billing</strong>. No restart needed: replies resume as soon
        as there is credit. Visitors are told the assistant is temporarily unavailable.
      </>
    ),
  },
  model_unavailable: {
    short: 'Model not available',
    title: (_bot, model) => `The model "${model}" isn't available to this API key`,
    fix: () => (
      <>
        Set <code>CLAUDE_MODEL</code> in <code>apps/api/.env</code> to a model your key can use, then restart the API.
      </>
    ),
  },
  rate_limited: {
    short: 'Rate limited',
    title: () => 'Claude is rate limiting requests',
    fix: () => <>Visitors are asked to try again in a minute. If it keeps happening, raise your usage limits in the Anthropic Console.</>,
  },
  unavailable: {
    short: 'AI not responding',
    title: () => "Claude isn't responding",
    fix: () => <>This is usually temporary. Visitors are asked to try again shortly; nothing to change on your side.</>,
  },
};

/** Sidebar status pill: green when Sunny can answer, amber with the reason when it can't. */
export function AssistantStatusPill({ botName }: { botName: string }) {
  const status = useAssistantStatus();
  const state = status.data?.state;
  if (!state || state === 'ready') {
    return (
      <div className="flex items-center gap-2.5 rounded-[14px] bg-success-bg px-3 py-2.5">
        <span className="size-2.5 flex-none rounded-full bg-success shadow-[0_0_0_4px_rgba(14,159,110,0.18)]" />
        <div className="flex flex-col leading-[1.3]">
          <strong className="text-sm text-success-ink">{botName} is live</strong>
          <span className="text-xs text-[#2F5E4E]">Answering on your website</span>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2.5 rounded-[14px] bg-amber-bg px-3 py-2.5">
      <span className="size-2.5 flex-none rounded-full bg-amber shadow-[0_0_0_4px_rgba(255,210,122,0.35)]" />
      <div className="flex flex-col leading-[1.3]">
        <strong className="text-sm text-amber-ink">{botName} is offline</strong>
        <span className="text-xs text-amber-ink/80">{ISSUES[state].short}</span>
      </div>
    </div>
  );
}

/** Banner across the top of every dashboard page while the assistant can't answer. */
export function AssistantStatusBanner({ botName }: { botName: string }) {
  const status = useAssistantStatus();
  const queryClient = useQueryClient();
  // A real one-token request to Claude, so a fix (new key, added credit) shows up immediately.
  const check = useMutation({
    mutationFn: () => api<AssistantStatus>('/assistant/status/check', { method: 'POST' }),
    onSuccess: (next) => queryClient.setQueryData(['assistant-status'], next),
  });
  const data = status.data;
  if (!data || data.state === 'ready') return null;
  const issue = ISSUES[data.state];
  return (
    <div role="alert" className="mb-6 flex flex-wrap items-start gap-4 rounded-3xl border-2 border-amber bg-white p-5 shadow-rest">
      <span className="flex size-11 flex-none items-center justify-center rounded-full bg-amber-bg text-amber-ink" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 0 1-12 0zM12 17v4" />
        </svg>
      </span>
      <div className="min-w-0 flex-[1_1_320px]">
        <p className="text-[17px] leading-snug font-bold">{issue.title(botName, data.model)}</p>
        <p className="mt-1 max-w-3xl text-[15px] text-ink-700 [&_code]:rounded-md [&_code]:bg-mist [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[13px]">
          {issue.fix(data.model)}
        </p>
        {data.since && <p className="mt-2 text-[13px] text-ink-500">First seen {timeAgo(data.since)}. This clears automatically after the next successful reply.</p>}
        {data.state === 'missing_key' && <p className="mt-2 text-[13px] text-ink-500">The API reads the key at startup, so restart it after editing the file.</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <a
          href={CONSOLE}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-10 items-center gap-1.5 rounded-full bg-night-900 px-4 text-sm font-bold text-white no-underline hover:bg-night-800"
        >
          Anthropic Console
          <ExternalIcon size={14} />
        </a>
        <button
          type="button"
          onClick={() => check.mutate()}
          disabled={check.isPending}
          className="h-10 rounded-full border-[1.5px] border-line-strong bg-white px-4 text-sm font-bold hover:border-night-900 disabled:opacity-60"
        >
          {check.isPending ? 'Checking…' : 'Check again'}
        </button>
      </div>
    </div>
  );
}

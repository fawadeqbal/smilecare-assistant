'use client';

import type { BusinessSettings, UpdateBusinessSettingsRequest } from '@smilecare/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Button, ErrorNote, PageHeader, Panel, Skeleton } from '@/components/admin/ui';
import { api } from '@/lib/api';

const PUBLIC_API = (process.env.NEXT_PUBLIC_API_PUBLIC_URL ?? 'http://localhost:4000').replace(/\/$/, '');

export default function SettingsPage() {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ['settings'], queryFn: () => api<BusinessSettings>('/settings') });
  const [form, setForm] = useState<BusinessSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (q.data && !form) setForm(q.data);
  }, [q.data, form]);

  const save = useMutation({
    mutationFn: (body: UpdateBusinessSettingsRequest) => api<BusinessSettings>('/settings', { method: 'PATCH', json: body }),
    onSuccess: (data) => {
      qc.setQueryData(['settings'], data);
      setForm(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  if (!form) {
    return (
      <>
        <PageHeader title="Assistant settings" />
        {q.error ? <ErrorNote error={q.error} /> : <Panel><Skeleton rows={6} /></Panel>}
      </>
    );
  }

  const set = <K extends keyof BusinessSettings>(key: K, value: BusinessSettings[K]) => setForm({ ...form, [key]: value });
  const snippet = `<script src="${PUBLIC_API}/widget.js" data-widget-key="${form.widgetKey}" defer></script>`;
  const field = 'mt-1 w-full rounded-xl border border-line px-4 py-2.5 outline-none focus:border-brand';

  return (
    <>
      <PageHeader title="Assistant settings" description="How the assistant introduces itself, and where staff notifications go." />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <Panel className="p-5 sm:p-6">
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate({
                businessName: form.businessName,
                botName: form.botName,
                welcomeMessage: form.welcomeMessage,
                brandColor: form.brandColor,
                suggestedQuestions: form.suggestedQuestions.map((s) => s.trim()).filter(Boolean),
                handoffEmail: form.handoffEmail || null,
                notificationEmail: form.notificationEmail || null,
                timezone: form.timezone,
              });
            }}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold">Business name</span>
                <input className={field} value={form.businessName} onChange={(e) => set('businessName', e.target.value)} required />
              </label>
              <label className="block">
                <span className="text-sm font-bold">Assistant name</span>
                <input className={field} value={form.botName} onChange={(e) => set('botName', e.target.value)} required maxLength={60} />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-bold">Welcome message</span>
              <textarea className={field} rows={3} value={form.welcomeMessage} onChange={(e) => set('welcomeMessage', e.target.value)} required maxLength={500} />
            </label>
            <label className="block">
              <span className="text-sm font-bold">Suggested questions</span>
              <textarea
                className={field}
                rows={4}
                value={form.suggestedQuestions.join('\n')}
                onChange={(e) => set('suggestedQuestions', e.target.value.split('\n').slice(0, 6))}
              />
              <span className="mt-1 block text-sm text-slate">One per line, up to 6. Shown as buttons before the visitor types.</span>
            </label>
            <div className="grid gap-5 sm:grid-cols-[auto_1fr]">
              <label className="block">
                <span className="text-sm font-bold">Brand color</span>
                <div className="mt-1 flex items-center gap-2">
                  <input type="color" value={form.brandColor} onChange={(e) => set('brandColor', e.target.value)} className="h-11 w-14 cursor-pointer rounded-lg border border-line" aria-label="Pick brand color" />
                  <input className="w-28 rounded-xl border border-line px-3 py-2.5 font-mono text-sm outline-none focus:border-brand" value={form.brandColor} onChange={(e) => set('brandColor', e.target.value)} pattern="#[0-9a-fA-F]{6}" aria-label="Brand color hex" />
                </div>
              </label>
              <label className="block">
                <span className="text-sm font-bold">Time zone</span>
                <input className={field} value={form.timezone} onChange={(e) => set('timezone', e.target.value)} placeholder="America/New_York" />
              </label>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-bold">Email for handoffs</span>
                <input type="email" className={field} value={form.handoffEmail ?? ''} onChange={(e) => set('handoffEmail', e.target.value)} placeholder="frontdesk@clinic.com" />
                <span className="mt-1 block text-sm text-slate">Gets the transcript when a visitor needs a person.</span>
              </label>
              <label className="block">
                <span className="text-sm font-bold">Email for appointment requests</span>
                <input type="email" className={field} value={form.notificationEmail ?? ''} onChange={(e) => set('notificationEmail', e.target.value)} placeholder="bookings@clinic.com" />
              </label>
            </div>
            {save.error && <ErrorNote error={save.error} />}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? 'Saving…' : 'Save settings'}
              </Button>
              {saved && <span role="status" className="text-sm font-bold text-brand">Settings saved</span>}
            </div>
          </form>
        </Panel>

        <div className="space-y-6">
          <Panel className="p-5">
            <h2 className="font-display text-lg font-semibold">Preview</h2>
            <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-line">
              <div className="flex items-center gap-3 px-4 py-3 text-white" style={{ background: form.brandColor }}>
                <span className="grid size-9 place-items-center rounded-full bg-white/20 font-bold">{form.botName.charAt(0).toUpperCase()}</span>
                <div>
                  <p className="font-bold leading-tight">{form.botName}</p>
                  <p className="text-xs opacity-85">{form.businessName}</p>
                </div>
              </div>
              <div className="space-y-3 bg-porcelain p-4">
                <p className="max-w-[90%] rounded-2xl rounded-bl-md bg-white px-3.5 py-2.5 text-[15px] ring-1 ring-line">{form.welcomeMessage}</p>
                <div className="flex flex-wrap gap-2">
                  {form.suggestedQuestions.filter(Boolean).map((s) => (
                    <span key={s} className="rounded-full bg-white px-3 py-1 text-sm ring-1" style={{ color: form.brandColor, borderColor: form.brandColor }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="p-5">
            <h2 className="font-display text-lg font-semibold">Add the assistant to a website</h2>
            <p className="mt-1 text-sm text-slate">Paste this just before the closing &lt;/body&gt; tag on every page.</p>
            <pre className="mt-3 rounded-xl bg-pine p-3 text-[13px] leading-relaxed break-all whitespace-pre-wrap text-mint">{snippet}</pre>
            <Button
              variant="secondary"
              className="mt-3"
              onClick={async () => {
                await navigator.clipboard.writeText(snippet);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? 'Copied' : 'Copy code'}
            </Button>
          </Panel>
        </div>
      </div>
    </>
  );
}

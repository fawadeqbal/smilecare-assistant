'use client';

import type { BusinessSettings, UpdateBusinessSettingsRequest } from '@smilecare/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Button, ErrorNote, PageHeader, Panel, Skeleton, fieldClass, textareaClass } from '@/components/admin/ui';
import { CheckIcon } from '@/components/icons';
import { api } from '@/lib/api';
import { installSnippet } from '@/lib/snippet';

const label = 'text-sm font-semibold';
const hint = 'mt-1.5 block text-[13px] text-ink-500';

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
        {q.error ? (
          <ErrorNote error={q.error} />
        ) : (
          <Panel>
            <Skeleton rows={6} />
          </Panel>
        )}
      </>
    );
  }

  const set = <K extends keyof BusinessSettings>(key: K, value: BusinessSettings[K]) => setForm({ ...form, [key]: value });
  const snippet = installSnippet(form.widgetKey);
  const validColor = /^#[0-9a-f]{6}$/i.test(form.brandColor);
  const brand = validColor ? form.brandColor : '#3355FF';

  return (
    <>
      <PageHeader title="Assistant settings" description={`How ${form.botName} introduces itself, and where staff notifications go.`} />

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <Panel className="p-[clamp(20px,3vw,32px)]">
          <form
            className="flex flex-col gap-5"
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
                <span className={label}>Business name</span>
                <input className={fieldClass} value={form.businessName} onChange={(e) => set('businessName', e.target.value)} required />
              </label>
              <label className="block">
                <span className={label}>Assistant name</span>
                <input className={fieldClass} value={form.botName} onChange={(e) => set('botName', e.target.value)} required maxLength={60} />
              </label>
            </div>
            <label className="block">
              <span className={label}>Welcome message</span>
              <textarea className={textareaClass} rows={3} value={form.welcomeMessage} onChange={(e) => set('welcomeMessage', e.target.value)} required maxLength={500} />
            </label>
            <label className="block">
              <span className={label}>Suggested questions</span>
              <textarea
                className={textareaClass}
                rows={4}
                value={form.suggestedQuestions.join('\n')}
                onChange={(e) => set('suggestedQuestions', e.target.value.split('\n').slice(0, 6))}
              />
              <span className={hint}>One per line, up to 6. Shown as buttons before the visitor types.</span>
            </label>
            <div className="grid gap-5 sm:grid-cols-[auto_1fr]">
              <div>
                <span className={label}>Brand color</span>
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="color"
                    value={brand}
                    onChange={(e) => set('brandColor', e.target.value)}
                    className="h-[52px] w-14 cursor-pointer rounded-[14px] border-[1.5px] border-line-strong bg-white p-1"
                    aria-label="Pick brand color"
                  />
                  <input
                    className="h-[52px] w-32 rounded-[14px] border-[1.5px] border-line-strong px-3 font-mono text-sm outline-none focus:border-azure-600"
                    value={form.brandColor}
                    onChange={(e) => set('brandColor', e.target.value)}
                    pattern="#[0-9a-fA-F]{6}"
                    aria-label="Brand color hex code"
                  />
                </div>
              </div>
              <label className="block">
                <span className={label}>Time zone</span>
                <input className={fieldClass} value={form.timezone} onChange={(e) => set('timezone', e.target.value)} placeholder="America/New_York" />
              </label>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className={label}>Email for handoffs</span>
                <input
                  type="email"
                  className={fieldClass}
                  value={form.handoffEmail ?? ''}
                  onChange={(e) => set('handoffEmail', e.target.value)}
                  placeholder="frontdesk@clinic.com"
                />
                <span className={hint}>Gets the transcript when a visitor needs a person.</span>
              </label>
              <label className="block">
                <span className={label}>Email for appointment requests</span>
                <input
                  type="email"
                  className={fieldClass}
                  value={form.notificationEmail ?? ''}
                  onChange={(e) => set('notificationEmail', e.target.value)}
                  placeholder="bookings@clinic.com"
                />
              </label>
            </div>
            {save.error && <ErrorNote error={save.error} />}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={save.isPending} className="h-[52px] px-[26px] text-base shadow-[0_8px_20px_-6px_rgba(51,85,255,0.55)]">
                {save.isPending ? 'Saving…' : 'Save settings'}
              </Button>
              {saved && (
                <span role="status" className="inline-flex items-center gap-1.5 text-sm font-bold text-success-ink">
                  <CheckIcon size={16} strokeWidth={2.6} />
                  Settings saved
                </span>
              )}
            </div>
          </form>
        </Panel>

        <div className="flex flex-col gap-5">
          <Panel className="p-5">
            <h2 className="font-display text-xl font-bold">Preview</h2>
            <div className="mt-4 overflow-hidden rounded-3xl shadow-overlay">
              <div
                className="relative flex items-center gap-3 overflow-hidden bg-night-950 px-4 py-3.5 text-white"
                style={{ backgroundImage: `radial-gradient(240px circle at 100% 0%, color-mix(in srgb, ${brand} 70%, transparent), transparent 70%)` }}
              >
                <span className="relative">
                  <svg width="38" height="38" viewBox="0 0 40 40" aria-hidden="true">
                    <circle cx="20" cy="20" r="20" fill="#FFFFFF" />
                    <path d="M11 19 Q20 29 29 19" stroke={brand} strokeWidth="3.6" fill="none" strokeLinecap="round" />
                    <circle cx="14" cy="13.5" r="2" fill={brand} />
                    <circle cx="26" cy="13.5" r="2" fill={brand} />
                  </svg>
                  <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-night-950 bg-aqua-400" />
                </span>
                <div className="relative">
                  <p className="font-display text-[17px] leading-tight font-bold">{form.botName}</p>
                  <p className="text-xs text-haze">{form.businessName} · replies instantly</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 bg-pearl p-4">
                <p className="max-w-[92%] rounded-[20px_20px_20px_6px] bg-white px-3.5 py-2.5 text-[15px] shadow-rest">{form.welcomeMessage}</p>
                <div className="flex flex-wrap gap-2">
                  {form.suggestedQuestions.filter(Boolean).map((s) => (
                    <span
                      key={s}
                      className="rounded-full border-[1.5px] bg-white px-3 py-1.5 text-sm font-semibold"
                      style={{ color: brand, borderColor: `color-mix(in srgb, ${brand} 30%, white)` }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Panel>

          <Panel className="p-5">
            <h2 className="font-display text-xl font-bold">Add {form.botName} to a website</h2>
            <p className="mt-1 text-sm text-ink-500">Paste this just before the closing &lt;/body&gt; tag on every page.</p>
            <pre className="mt-3 rounded-2xl bg-ink p-3.5 text-[13px] leading-relaxed break-all whitespace-pre-wrap text-azure-100">{snippet}</pre>
            <Button
              variant="tonal"
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

'use client';

import type { AuthUser, BusinessSettings, OverviewStats } from '@smilecare/shared';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { AssistantStatusBanner, AssistantStatusPill } from '@/components/admin/assistant-status';
import { ArcDecoration, SmileMark, Wordmark } from '@/components/brand';
import { BookIcon, CalendarIcon, ChatIcon, ExternalIcon, GridIcon, MenuIcon, SignOutIcon, SlidersIcon } from '@/components/icons';
import { api } from '@/lib/api';
import { installSnippet } from '@/lib/snippet';

function useCounts() {
  return useQuery({
    queryKey: ['overview', 7],
    queryFn: () => api<OverviewStats>('/analytics/overview?days=7'),
    refetchInterval: 30_000,
  });
}

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<AuthUser>('/auth/me') });
  const settings = useQuery({ queryKey: ['settings'], queryFn: () => api<BusinessSettings>('/settings') });
  const counts = useCounts();
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const nav = [
    { href: '/admin', label: 'Overview', icon: GridIcon },
    {
      href: '/admin/conversations',
      label: 'Conversations',
      icon: ChatIcon,
      count: counts.data?.waiting.count,
      countClass: 'bg-amber-bg text-amber-ink',
      countLabel: 'waiting for a person',
    },
    {
      href: '/admin/bookings',
      label: 'Appointment requests',
      icon: CalendarIcon,
      count: counts.data?.bookings.pending,
      countClass: 'bg-warning-bg text-warning-ink',
      countLabel: 'to confirm',
    },
    { href: '/admin/knowledge', label: 'Knowledge', icon: BookIcon },
    { href: '/admin/settings', label: 'Assistant settings', icon: SlidersIcon },
  ];

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  async function copyInstall() {
    if (!settings.data) return;
    await navigator.clipboard.writeText(installSnippet(settings.data.widgetKey));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));
  const initials = (me.data?.businessName ?? 'SC')
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-dvh bg-pearl lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="border-b border-line bg-white lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between px-[22px] py-[22px]">
          <Link href="/" className="flex items-center gap-2.5 text-ink no-underline">
            <SmileMark size={34} />
            <Wordmark className="text-[21px]" />
          </Link>
          <button
            className="flex size-11 items-center justify-center rounded-full border-[1.5px] border-line lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="admin-nav"
            aria-label="Menu"
          >
            <MenuIcon />
          </button>
        </div>

        <div id="admin-nav" className={`${menuOpen ? 'flex' : 'hidden'} flex-1 flex-col gap-[22px] px-3.5 pb-5 lg:flex`}>
          <AssistantStatusPill botName={settings.data?.botName ?? 'Sunny'} />

          <nav aria-label="Dashboard" className="flex flex-col gap-0.5">
            <span className="px-3 pb-1.5 text-xs font-bold tracking-[0.1em] text-ink-400 uppercase">Workspace</span>
            {nav.map(({ href, label, icon: Icon, count, countClass, countLabel }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                aria-current={isActive(href) ? 'page' : undefined}
                className={`flex h-11 items-center gap-3 rounded-xl px-3 text-[15px] no-underline transition-colors ${
                  isActive(href) ? 'bg-azure-50 font-bold text-azure-700' : 'font-semibold text-ink-700 hover:bg-pearl'
                }`}
              >
                <Icon size={20} />
                <span className="flex-1">{label}</span>
                {!!count && (
                  <span className={`rounded-full px-2 text-xs font-bold ${countClass}`}>
                    {count}
                    <span className="sr-only"> {countLabel}</span>
                  </span>
                )}
              </Link>
            ))}
          </nav>

          <div className="relative flex flex-col gap-2.5 overflow-hidden rounded-[18px] bg-ink p-[18px] text-white">
            <ArcDecoration className="-right-8 -bottom-12 size-[150px]" stroke="#1B2340" />
            <strong className="relative font-display text-[17px] leading-[1.25]">Put {settings.data?.botName ?? 'Sunny'} on another page</strong>
            <span className="relative text-[13px] text-haze">One script tag. Works on any website builder.</span>
            <button
              type="button"
              onClick={copyInstall}
              disabled={!settings.data}
              className="relative h-9 self-start rounded-full bg-white px-3.5 text-[13px] font-bold text-ink disabled:opacity-70"
            >
              {copied ? 'Copied' : 'Copy install code'}
            </button>
          </div>

          <div className="mt-auto flex items-center gap-2.5 border-t border-line px-2 pt-3">
            <span className="flex size-[38px] flex-none items-center justify-center rounded-full bg-amber-bg text-sm font-bold text-amber-ink">
              {initials}
            </span>
            <div className="flex min-w-0 flex-1 flex-col leading-[1.35]">
              <strong className="truncate text-sm">{me.data?.businessName ?? ' '}</strong>
              <span className="truncate text-[13px] text-ink-500">{me.data?.email ?? ' '}</span>
            </div>
            <button
              type="button"
              onClick={signOut}
              aria-label="Sign out"
              title="Sign out"
              className="flex size-10 flex-none items-center justify-center rounded-xl text-ink-500 hover:bg-pearl hover:text-ink"
            >
              <SignOutIcon size={18} />
            </button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 px-[clamp(16px,3.5vw,44px)] pt-[18px] pb-12">
        <div className="mb-5 flex justify-end">
          <Link
            href="/"
            target="_blank"
            className="inline-flex h-11 items-center gap-2 rounded-full border-[1.5px] border-line bg-white px-[18px] font-bold text-ink no-underline hover:border-azure-300"
          >
            <ChatIcon size={18} className="text-azure-600" />
            Preview {settings.data?.botName ?? 'Sunny'}
            <ExternalIcon size={14} className="text-ink-400" />
          </Link>
        </div>
        <AssistantStatusBanner botName={settings.data?.botName ?? 'Sunny'} />
        {children}
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () => new QueryClient({ defaultOptions: { queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: true } } }),
  );
  return (
    <QueryClientProvider client={client}>
      <Shell>{children}</Shell>
    </QueryClientProvider>
  );
}

'use client';

import type { AuthUser } from '@smilecare/shared';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api';

const nav = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/conversations', label: 'Conversations' },
  { href: '/admin/bookings', label: 'Appointment requests' },
  { href: '/admin/knowledge', label: 'Knowledge' },
  { href: '/admin/settings', label: 'Assistant settings' },
];

function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const me = useQuery({ queryKey: ['me'], queryFn: () => api<AuthUser>('/auth/me') });
  const [menuOpen, setMenuOpen] = useState(false);

  async function signOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
    router.refresh();
  }

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="border-b border-line bg-white lg:sticky lg:top-0 lg:h-dvh lg:border-r lg:border-b-0">
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/admin" className="font-display text-xl font-bold tracking-tight">
            SmileCare<span className="text-brand">.</span>
          </Link>
          <button
            className="rounded-lg px-3 py-1.5 text-sm font-bold ring-1 ring-line lg:hidden"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="admin-nav"
          >
            Menu
          </button>
        </div>
        <div id="admin-nav" className={`${menuOpen ? 'block' : 'hidden'} lg:flex lg:h-[calc(100dvh-72px)] lg:flex-col`}>
          <nav aria-label="Dashboard" className="space-y-0.5 px-3">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                aria-current={isActive(item.href) ? 'page' : undefined}
                className={`block rounded-xl px-3 py-2.5 text-[15px] transition-colors ${
                  isActive(item.href) ? 'bg-mint font-bold text-pine' : 'text-slate hover:bg-porcelain hover:text-pine'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="mt-6 border-t border-line px-5 py-5 text-sm lg:mt-auto">
            <p className="font-bold">{me.data?.businessName ?? ' '}</p>
            <p className="truncate text-slate">{me.data?.email ?? ' '}</p>
            <div className="mt-3 flex gap-4">
              <Link href="/" target="_blank" className="font-bold text-brand hover:underline">
                View website
              </Link>
              <button onClick={signOut} className="font-bold text-slate hover:text-pine">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>
      <main className="min-w-0 px-5 py-8 sm:px-8 lg:px-12 lg:py-10">{children}</main>
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

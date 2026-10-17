'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { fieldClass } from '@/components/admin/ui';
import { ArcDecoration, SmileMark, Wordmark } from '@/components/brand';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(e.currentTarget);
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
    });
    if (res.ok) {
      const next = params.get('next');
      router.replace(next?.startsWith('/admin') ? next : '/admin');
      router.refresh();
      return;
    }
    const body = await res.json().catch(() => ({}));
    setError(
      res.status === 401
        ? 'That email and password don’t match. Check them and try again.'
        : res.status === 429
          ? 'Too many attempts. Wait a minute, then try again.'
          : Array.isArray(body.message)
            ? body.message.join('. ')
            : body.message ?? 'Sign-in failed. Check the API is running.',
    );
    setPending(false);
  }

  return (
    <form onSubmit={onSubmit} className="mt-8 space-y-5">
      <label className="block">
        <span className="text-sm font-semibold">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          defaultValue="admin@smilecare.dev"
          className={fieldClass}
        />
      </label>
      <label className="block">
        <span className="text-sm font-semibold">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          className={fieldClass}
        />
      </label>
      {error && (
        <p role="alert" className="rounded-2xl bg-danger-bg px-4 py-3 text-sm text-danger-ink">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="h-[52px] w-full rounded-full bg-ocean-600 font-bold text-white shadow-[0_8px_20px_-6px_rgba(10,102,240,0.55)] transition-colors hover:bg-ocean-700 disabled:opacity-60"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden bg-ocean-50 px-5 py-10">
      <ArcDecoration className="-top-40 -right-40 size-[620px]" stroke="#DCEAFF" width={26} />
      <div className="relative w-full max-w-[420px] rounded-[28px] bg-white p-[clamp(24px,5vw,40px)] shadow-overlay">
        <Link href="/" className="flex items-center gap-2.5 text-ink no-underline">
          <SmileMark size={36} />
          <Wordmark className="text-[22px]" />
        </Link>
        <h1 className="mt-7 font-display text-[32px] leading-[1.1] font-extrabold tracking-[-0.03em]">Sign in to the staff dashboard</h1>
        <p className="mt-2 text-ink-700">Review conversations, confirm appointment requests and manage what Sunny knows.</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}

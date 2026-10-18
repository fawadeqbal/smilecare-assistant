'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { fieldClass } from '@/components/admin/ui';
import { Accent, SmileMark, Wordmark } from '@/components/brand';

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
        className="h-[52px] w-full rounded-full bg-azure-600 font-bold text-white shadow-glow-sm transition-colors hover:bg-azure-700 disabled:opacity-60"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main
      className="relative grid min-h-dvh place-items-center overflow-hidden bg-night-950 px-5 py-10"
      style={{
        backgroundImage:
          'radial-gradient(820px circle at 88% 8%, rgba(51,85,255,0.5), transparent 60%), radial-gradient(640px circle at 4% 96%, rgba(47,224,200,0.2), transparent 60%)',
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '56px 56px',
        }}
      />
      <div className="relative w-full max-w-[420px] rounded-[30px] bg-white p-[clamp(24px,5vw,40px)] shadow-[0_0_0_1px_rgba(255,255,255,0.2),0_40px_100px_-24px_rgba(0,0,0,0.6),0_0_80px_-20px_rgba(51,85,255,0.6)]">
        <Link href="/" className="flex items-center gap-2.5 text-ink no-underline">
          <SmileMark size={36} />
          <Wordmark className="text-[22px]" />
        </Link>
        <h1 className="mt-7 text-[32px] leading-[1.1] font-bold tracking-[-0.04em]">
          Sign in to the <Accent>staff dashboard</Accent>
        </h1>
        <p className="mt-2 text-ink-700">Review conversations, confirm appointment requests and manage what Sunny knows.</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}

'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

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
        <span className="text-sm font-bold">Email</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          defaultValue="admin@smilecare.dev"
          className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-brand"
        />
      </label>
      <label className="block">
        <span className="text-sm font-bold">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="current-password"
          className="mt-1.5 w-full rounded-xl border border-line bg-white px-4 py-3 outline-none focus:border-brand"
        />
      </label>
      {error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-pine py-3 font-bold text-white transition-colors hover:bg-brand disabled:opacity-60"
      >
        {pending ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-mint px-5">
      <div className="w-full max-w-sm">
        <Link href="/" className="font-display text-2xl font-bold tracking-tight">
          SmileCare<span className="text-brand">.</span>
        </Link>
        <h1 className="mt-8 font-display text-3xl font-bold tracking-tight">Sign in to the staff dashboard</h1>
        <p className="mt-2 text-slate">Review conversations, confirm appointment requests and manage what the assistant knows.</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}

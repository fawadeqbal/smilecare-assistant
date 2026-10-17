import type { LoginResponse } from '@smilecare/shared';
import { NextResponse } from 'next/server';
import { apiUrl, SESSION_COOKIE } from '@/lib/session';

/**
 * Backend-for-frontend login: exchanges credentials for an API token and stores it
 * in an httpOnly cookie, so the token never touches client-side JavaScript.
 */
export async function POST(request: Request) {
  const body = await request.text();
  const res = await fetch(`${apiUrl()}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': request.headers.get('x-forwarded-for') ?? '' },
    body,
    cache: 'no-store',
  });

  const data = await res.json().catch(() => ({ message: 'Login failed' }));
  if (!res.ok) return NextResponse.json(data, { status: res.status });

  const { accessToken, expiresIn, user } = data as LoginResponse;
  const response = NextResponse.json({ user });
  response.cookies.set(SESSION_COOKIE, accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: expiresIn,
  });
  return response;
}

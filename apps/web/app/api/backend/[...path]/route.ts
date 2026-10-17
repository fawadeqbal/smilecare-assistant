import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { apiUrl, SESSION_COOKIE } from '@/lib/session';

/**
 * Authenticated proxy from the dashboard to the API: `/api/backend/<path>` → `<API_URL>/v1/<path>`.
 * Adds the bearer token from the httpOnly cookie and streams the response back unchanged
 * (JSON, CSV exports, file uploads).
 */
async function forward(request: Request, ctx: RouteContext<'/api/backend/[...path]'>) {
  const { path } = await ctx.params;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return NextResponse.json({ statusCode: 401, message: 'Not signed in' }, { status: 401 });

  const source = new URL(request.url);
  const target = `${apiUrl()}/v1/${path.map(encodeURIComponent).join('/')}${source.search}`;

  const headers = new Headers();
  headers.set('Authorization', `Bearer ${token}`);
  for (const name of ['content-type', 'accept', 'x-request-id', 'x-forwarded-for']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  const hasBody = !['GET', 'HEAD'].includes(request.method);
  const upstream = await fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    cache: 'no-store',
    // Required by Node's fetch when streaming a request body.
    ...(hasBody ? { duplex: 'half' } : {}),
  } as RequestInit);

  const responseHeaders = new Headers();
  for (const name of ['content-type', 'content-disposition', 'x-request-id']) {
    const value = upstream.headers.get(name);
    if (value) responseHeaders.set(name, value);
  }

  const response = new NextResponse(upstream.status === 204 ? null : upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
  // An expired token logs the dashboard out cleanly.
  if (upstream.status === 401) response.cookies.delete(SESSION_COOKIE);
  return response;
}

export { forward as GET, forward as POST, forward as PATCH, forward as PUT, forward as DELETE };

/** Name of the httpOnly cookie holding the admin's API access token. Never readable from browser JS. */
export const SESSION_COOKIE = 'sc_session';

export function apiUrl(): string {
  return (process.env.API_URL ?? 'http://localhost:4000').replace(/\/$/, '');
}

/**
 * Token storage helpers (Req 11.6).
 *
 * The JWT is persisted in localStorage so it survives reloads and is injected
 * into every RTK Query request via prepareHeaders. All access is SSR-safe
 * (guards `window`) so this module can be imported in server components.
 */

const TOKEN_KEY = 'auth.token';

/** True when running in a browser (localStorage available). */
function hasStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

/** Returns the stored JWT, or null if none / not in a browser. */
export function getToken(): string | null {
  if (!hasStorage()) return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

/** Persists the JWT. */
export function setToken(token: string): void {
  if (!hasStorage()) return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

/** Clears the stored JWT. */
export function clearToken(): void {
  if (!hasStorage()) return;
  window.localStorage.removeItem(TOKEN_KEY);
}

/**
 * Property-based test for authenticated request header injection (Property 21).
 *
 * Mirrors the prepareHeaders logic in the API slice: for any stored token, an
 * outgoing request carries `Authorization: Bearer <token>`; with no token, no
 * Authorization header is set.
 *
 * Tokens are generated from the JWT/base64url alphabet (no whitespace). This
 * reflects real Cognito tokens and avoids the WHATWG `Headers` value
 * normalization that strips surrounding whitespace from header values.
 */

import fc from 'fast-check';

import { clearToken, getToken, setToken } from '@/lib/auth';

/** The exact header-preparation logic used by the RTK Query baseQuery. */
function applyAuthHeader(headers: Headers): Headers {
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return headers;
}

/** A JWT-like token: three base64url segments joined by dots. */
const jwtLikeArb = fc
  .stringMatching(/^[A-Za-z0-9_-]{1,60}$/)
  .chain((a) =>
    fc
      .stringMatching(/^[A-Za-z0-9_-]{1,60}$/)
      .chain((b) =>
        fc
          .stringMatching(/^[A-Za-z0-9_-]{1,60}$/)
          .map((c) => `${a}.${b}.${c}`),
      ),
  );

beforeEach(() => {
  window.localStorage.clear();
});

// Feature: inventory-management-dashboard, Property 21: Authenticated request header injection
test('Property 21: a stored token is attached as a Bearer header; none when absent', () => {
  fc.assert(
    fc.property(jwtLikeArb, (token) => {
      clearToken();
      setToken(token);
      const headers = applyAuthHeader(new Headers());
      return headers.get('Authorization') === `Bearer ${token}`;
    }),
    { numRuns: 200 },
  );

  // No token -> no Authorization header.
  clearToken();
  const headers = applyAuthHeader(new Headers());
  expect(headers.get('Authorization')).toBeNull();
});

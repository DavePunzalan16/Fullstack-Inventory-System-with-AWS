/**
 * Local development authentication (AUTH_MODE=dev only).
 *
 * Provides a token verifier and a login helper that let you sign in locally as
 * a seeded user WITHOUT AWS Cognito. This is strictly for local development:
 * app.ts only wires it when config.authMode === "dev". In production
 * (authMode "cognito") real JWT verification via aws-jwt-verify is used and
 * this module is never enabled.
 *
 * Dev token format: "dev.<cognitoSub>". The verifier decodes the sub and
 * returns claims; role resolution then falls back to the DB user record.
 */

import type { TokenVerifier, VerifiedClaims } from '../middleware/auth';

const DEV_PREFIX = 'dev.';

/** Builds a dev token for a given Cognito subject. */
export function makeDevToken(cognitoSub: string): string {
  return `${DEV_PREFIX}${cognitoSub}`;
}

/** A TokenVerifier that accepts dev tokens of the form "dev.<sub>". */
export function createDevVerifier(): TokenVerifier {
  return async function verify(token: string): Promise<VerifiedClaims> {
    if (!token.startsWith(DEV_PREFIX)) {
      throw new Error('Invalid dev token');
    }
    const sub = token.slice(DEV_PREFIX.length).trim();
    if (sub === '') {
      throw new Error('Invalid dev token: empty subject');
    }
    // No role claim here on purpose: role is resolved from the DB user record,
    // exercising the same precedence path as production.
    return { sub };
  };
}

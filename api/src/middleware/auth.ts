/**
 * Cognito JWT authentication and role resolution (Req 11.8â€“11.10, 12.1, 12.2).
 *
 * Verifies the bearer token using a Cognito JWT verifier (JWKS-backed), then
 * resolves the caller's role. Role resolution precedence (Property 16 / Req
 * 12.1): a non-empty JWT role claim wins; otherwise the role is read from the
 * User database record.
 *
 * The verifier and the DB role lookup are injected so the middleware can be
 * unit/property tested without contacting Cognito or a real database.
 */

import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { UnauthorizedError } from '../lib/errors';
import type { AuthenticatedUser, Role } from '../types';

/** Claims we care about from a verified Cognito token. */
export interface VerifiedClaims {
  readonly sub: string;
  readonly email?: string;
  /** `custom:role` claim, if present. */
  readonly 'custom:role'?: string;
  /** `cognito:groups` claim, if present. */
  readonly 'cognito:groups'?: readonly string[];
  readonly [key: string]: unknown;
}

/** Verifies a raw JWT, resolving to its claims or rejecting when invalid. */
export type TokenVerifier = (token: string) => Promise<VerifiedClaims>;

/** Looks up a user's role by Cognito subject, or undefined if unknown. */
export type RoleLookup = (cognitoSub: string) => Promise<Role | undefined>;

/** True for the two recognized roles. */
function isRole(value: unknown): value is Role {
  return value === 'admin' || value === 'staff';
}

/**
 * Extracts a role from verified claims, or undefined when none is present.
 * Prefers `custom:role`, then the first recognized entry in `cognito:groups`.
 */
export function roleFromClaims(claims: VerifiedClaims): Role | undefined {
  const custom = claims['custom:role'];
  if (typeof custom === 'string' && custom.trim() !== '') {
    const normalized = custom.trim().toLowerCase();
    if (isRole(normalized)) {
      return normalized;
    }
  }
  const groups = claims['cognito:groups'];
  if (Array.isArray(groups)) {
    const match = groups
      .map((g) => (typeof g === 'string' ? g.trim().toLowerCase() : ''))
      .find((g) => isRole(g));
    if (match !== undefined && isRole(match)) {
      return match;
    }
  }
  return undefined;
}

/**
 * Resolves the effective role using the precedence rule (Property 16).
 *
 * @param claims - Verified JWT claims.
 * @param dbLookup - Fallback DB role lookup, used only when the claim is absent.
 */
export async function resolveRole(
  claims: VerifiedClaims,
  dbLookup: RoleLookup,
): Promise<Role | undefined> {
  const fromClaim = roleFromClaims(claims);
  if (fromClaim !== undefined) {
    return fromClaim;
  }
  return dbLookup(claims.sub);
}

/** Extracts a bearer token from the Authorization header, if well-formed. */
export function extractBearerToken(header: string | undefined): string | undefined {
  if (typeof header !== 'string') {
    return undefined;
  }
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  const token = match?.[1]?.trim();
  return token !== undefined && token !== '' ? token : undefined;
}

/** Options for {@link createAuthMiddleware}. */
export interface AuthOptions {
  readonly verifyToken: TokenVerifier;
  readonly lookupRole: RoleLookup;
  /**
   * When true, requests WITHOUT a token are allowed through with no eq.user`n   * (guest browsing); a present-but-invalid token is still rejected 401.
   * When false/omitted, a missing token is rejected 401 (default, strict).
   */
  readonly optional?: boolean;
}

/**
 * Builds the authentication middleware.
 *
 * Rejects with 401 when the token is missing, malformed, or fails verification
 * (Req 11.8, 12.2). When the verifier reports expiry, the message indicates
 * token expiration (Req 11.9). On success attaches `req.user` with the resolved
 * role and calls `next()`.
 */
export function createAuthMiddleware(options: AuthOptions): RequestHandler {
  const { verifyToken, lookupRole, optional = false } = options;

  return async function authenticate(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): Promise<void> {
    const token = extractBearerToken(req.headers.authorization);
    if (token === undefined) {
      // Optional mode: no token means an anonymous guest - allow through with
      // no req.user so role-gated (write) routes still return 403.
      if (optional) {
        next();
        return;
      }
      next(new UnauthorizedError('Missing or malformed authorization token'));
      return;
    }

    let claims: VerifiedClaims;
    try {
      claims = await verifyToken(token);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (/expir/i.test(message)) {
        next(new UnauthorizedError('Token expired'));
      } else {
        next(new UnauthorizedError('Invalid authorization token'));
      }
      return;
    }

    const role = await resolveRole(claims, lookupRole);
    const user: AuthenticatedUser = {
      cognitoSub: claims.sub,
      role,
      ...(typeof claims.email === 'string' ? { email: claims.email } : {}),
    };
    req.user = user;
    next();
  };
}

/**
 * Shared TypeScript types used across the API.
 */

import type { AppConfig } from '../config/env';

/** Recognized user roles (mirrors the Prisma `Role` enum). */
export type Role = 'admin' | 'staff';

/** The authenticated user attached to a request by the auth middleware. */
export interface AuthenticatedUser {
  /** Cognito subject identifier (`sub` claim). */
  readonly cognitoSub: string;
  /** Resolved role (JWT claim first, falling back to the DB record). */
  readonly role: Role | undefined;
  /** Email address, when available from the token. */
  readonly email?: string;
}

// Augment Express types so `req.user` and the injected config are typed.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Populated by the authentication middleware for protected routes. */
      user?: AuthenticatedUser;
    }
    interface Application {
      get(name: 'config'): AppConfig;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      get(name: string): any;
    }
  }
}

export {};

/**
 * Role-based access control guard (Req 4.4, 12.3–12.6, Property 15).
 *
 * The decision is exposed as the pure function {@link isAuthorized} so it can
 * be property-tested exhaustively. `requireRole(...)` wraps it as Express
 * middleware, rejecting unauthorized requests with 403 and performing no state
 * change (the guard runs before any handler).
 */

import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { ForbiddenError } from '../lib/errors';
import type { Role } from '../types';

/**
 * Decides whether a resolved role may access an endpoint requiring one of
 * `allowedRoles`.
 *
 * - A missing, empty, or unrecognized role is never authorized (Req 12.3).
 * - Otherwise, the role must be among `allowedRoles` (Req 12.4–12.6).
 *
 * @param role - The resolved role (or undefined when absent/unrecognized).
 * @param allowedRoles - Roles permitted on the endpoint.
 */
export function isAuthorized(
  role: Role | undefined,
  allowedRoles: readonly Role[],
): boolean {
  if (role !== 'admin' && role !== 'staff') {
    return false;
  }
  return allowedRoles.includes(role);
}

/**
 * Builds an RBAC middleware permitting only the given roles.
 *
 * Read endpoints use `requireRole('admin', 'staff')`; write endpoints use
 * `requireRole('admin')`.
 */
export function requireRole(...allowedRoles: Role[]): RequestHandler {
  return function authorize(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void {
    const role = req.user?.role;
    if (!isAuthorized(role, allowedRoles)) {
      next(
        new ForbiddenError(
          role === undefined
            ? 'Forbidden: role is not authorized'
            : 'Forbidden: action not permitted for role',
        ),
      );
      return;
    }
    next();
  };
}

/**
 * Email/password authentication service (Batch 3, extends the existing JWT auth).
 *
 * Local email/password accounts are stored in the User table with a bcrypt
 * passwordHash and a synthetic cognitoSub of the form "local:<uuid>". Login and
 * signup issue the app''s existing dev token (dev.<cognitoSub>), which the auth
 * middleware already verifies and whose role it resolves from the DB record.
 *
 * In production (AUTH_MODE=cognito) real Cognito JWTs are used instead; these
 * endpoints are intended for local/self-hosted email-password auth.
 */

import { randomUUID } from 'node:crypto';

import type { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

import { ConflictError, UnauthorizedError, ValidationError, NotFoundError } from './errors';
import { makeDevToken } from './devAuth';
import { prisma } from './prisma';

const SALT_ROUNDS = 10;

export interface AuthResult {
  token: string;
  user: { id: string; name: string; email: string; role: Role };
}

function publicUser(u: { id: string; name: string; email: string; role: Role }) {
  return { id: u.id, name: u.name, email: u.email, role: u.role };
}

/** Registers a new basic (role="user"... stored as "staff") account. */
export async function signup(email: string, password: string, name?: string): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new ValidationError([{ field: 'email', message: 'A valid email is required' }]);
  }
  if (password.length < 6) {
    throw new ValidationError([{ field: 'password', message: 'Password must be at least 6 characters' }]);
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing !== null) {
    throw new ConflictError('An account with this email already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  // Basic self-service signups are non-admin. The schema Role enum is
  // {admin, staff}; "staff" is the non-admin role used across the app.
  const user = await prisma.user.create({
    data: {
      cognitoSub: `local:${randomUUID()}`,
      name: name?.trim() || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      role: 'staff',
      passwordHash,
    },
  });

  return { token: makeDevToken(user.cognitoSub), user: publicUser(user) };
}

/** Authenticates an email/password account and issues a token. */
export async function login(email: string, password: string): Promise<AuthResult> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  // Uniform error to avoid leaking which part failed.
  if (user === null || user.passwordHash === null) {
    throw new UnauthorizedError('Invalid email or password');
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    throw new UnauthorizedError('Invalid email or password');
  }
  return { token: makeDevToken(user.cognitoSub), user: publicUser(user) };
}

/** Updates the authenticated user''s email and/or password (current password required to change password). */
export async function updateProfile(
  cognitoSub: string,
  input: { email?: string; newPassword?: string; currentPassword?: string },
): Promise<AuthResult['user']> {
  const user = await prisma.user.findUnique({ where: { cognitoSub } });
  if (user === null) {
    throw new NotFoundError('User not found');
  }

  const data: { email?: string; passwordHash?: string } = {};

  if (input.email) {
    const normalized = input.email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      throw new ValidationError([{ field: 'email', message: 'A valid email is required' }]);
    }
    if (normalized !== user.email) {
      const clash = await prisma.user.findUnique({ where: { email: normalized } });
      if (clash !== null) {
        throw new ConflictError('An account with this email already exists');
      }
      data.email = normalized;
    }
  }

  if (input.newPassword) {
    if (input.newPassword.length < 6) {
      throw new ValidationError([{ field: 'newPassword', message: 'Password must be at least 6 characters' }]);
    }
    // Changing a password requires the current one (when the account has a password).
    if (user.passwordHash !== null) {
      const ok = input.currentPassword
        ? await bcrypt.compare(input.currentPassword, user.passwordHash)
        : false;
      if (!ok) {
        throw new UnauthorizedError('Current password is incorrect');
      }
    }
    data.passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
  }

  if (Object.keys(data).length === 0) {
    return publicUser(user);
  }

  const updated = await prisma.user.update({ where: { cognitoSub }, data });
  return publicUser(updated);
}
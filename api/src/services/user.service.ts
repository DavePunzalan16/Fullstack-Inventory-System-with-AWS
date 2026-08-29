/**
 * User service (Req 6.1, 6.4).
 * Returns user records (id, name, email, role) linked to Cognito via cognitoSub.
 */

import { prisma } from '../lib/prisma';

/** Lists all users with public profile fields. */
export async function listUsers() {
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { name: 'asc' },
  });
}

/** Returns the profile for the authenticated user, or null if not found. */
export async function getByCognitoSub(cognitoSub: string) {
  return prisma.user.findUnique({
    where: { cognitoSub },
    select: { id: true, name: true, email: true, role: true },
  });
}

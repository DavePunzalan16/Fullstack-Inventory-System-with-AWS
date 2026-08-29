/**
 * Prisma client singleton.
 *
 * A single {@link PrismaClient} instance is shared across the application to
 * avoid exhausting database connections (especially under hot-reload in
 * development, where each reload would otherwise create a new client).
 *
 * The Prisma client reads its connection string from `DATABASE_URL`, which is
 * validated at startup by `config/env.ts` (Req 14.2, 24.2).
 */

import { PrismaClient } from '@prisma/client';

// Reuse a single client across module reloads in development.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/** The shared Prisma client instance used for all data access. */
export const prisma: PrismaClient =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

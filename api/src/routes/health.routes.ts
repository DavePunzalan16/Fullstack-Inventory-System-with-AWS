/**
 * Health endpoint (Req 14.7, 22.3, 22.4).
 *
 * `GET /health` returns 200 within ~1000ms with `{ status, version,
 * uptimeSeconds, database }`. The DB check is time-boxed; if it fails or times
 * out, `database` is reported as `"disconnected"` and the endpoint still
 * returns 200 (never 5xx). This route is excluded from rate limiting.
 */

import { Router, type Request, type Response } from 'express';

import { prisma } from '../lib/prisma';

/** Version reported by /health (from package version, fallback to unknown). */
const VERSION = process.env.npm_package_version ?? '0.1.0';

/** Time-box for the DB connectivity probe so /health stays under ~1000ms. */
const DB_CHECK_TIMEOUT_MS = 800;

/** Minimal client surface needed to probe the database. */
export interface HealthDbClient {
  $queryRaw(query: TemplateStringsArray, ...values: unknown[]): Promise<unknown>;
}

/** Probes the DB with a timeout; resolves to connected/disconnected. */
export async function checkDatabase(
  client: Pick<HealthDbClient, '$queryRaw'>,
  timeoutMs: number = DB_CHECK_TIMEOUT_MS,
): Promise<'connected' | 'disconnected'> {
  const timeout = new Promise<'disconnected'>((resolve) => {
    const t = setTimeout(() => resolve('disconnected'), timeoutMs);
    t.unref?.();
  });
  const probe = client
    .$queryRaw`SELECT 1`.then(() => 'connected' as const)
    .catch(() => 'disconnected' as const);
  return Promise.race([probe, timeout]);
}

/** Builds the health router. */
export function healthRouter(): Router {
  const router = Router();

  router.get('/health', async (_req: Request, res: Response) => {
    const database = await checkDatabase(prisma as unknown as HealthDbClient);
    res.status(200).json({
      status: 'ok',
      version: VERSION,
      uptimeSeconds: Math.floor(process.uptime()),
      database,
    });
  });

  return router;
}

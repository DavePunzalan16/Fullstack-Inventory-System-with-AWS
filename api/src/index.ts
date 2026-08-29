/**
 * API bootstrap.
 *
 * Startup sequence (fail-fast, no partial initialization):
 *   1. Validate environment variables (Req 14.2–14.4, Property 26). On any
 *      missing/empty required variable, abort with a named-variable error and
 *      never begin listening.
 *   2. Verify database connectivity within a ~10s timeout (Req 24.3). If the
 *      local database is unreachable, abort with a connection error and never
 *      begin listening — no request handling is initialized.
 *   3. Assemble the Express app and start listening on the configured PORT.
 *
 * `bootstrap()` is exported for testing; it is only auto-invoked when this
 * module is run as the main entry point.
 */

import type { Server } from 'http';

import { createApp } from './app';
import { loadConfig } from './config/env';
import { verifyDatabaseConnection } from './lib/dbConnect';
import { prisma } from './lib/prisma';

export { DB_CONNECT_TIMEOUT_MS, DatabaseConnectionError, verifyDatabaseConnection } from './lib/dbConnect';

/**
 * Runs the full startup sequence and begins listening.
 *
 * @returns The listening HTTP {@link Server}.
 * @throws {EnvValidationError} If required environment variables are missing.
 * @throws {DatabaseConnectionError} If the database is unreachable within the timeout.
 */
export async function bootstrap(): Promise<Server> {
  // Step 1: validate environment first — never listen if this throws.
  const config = loadConfig();

  // Step 2: verify DB connectivity before initializing any request handling.
  await verifyDatabaseConnection(prisma);

  // Step 3: assemble and start the server.
  const app = createApp(config);
  const server = await new Promise<Server>((resolve) => {
    const s = app.listen(config.port, () => resolve(s));
  });

  // eslint-disable-next-line no-console
  console.log(`inventory-api listening on port ${config.port}`);
  return server;
}

/** True when this module is executed directly (not imported by a test). */
const isMain = require.main === module;

if (isMain) {
  bootstrap().catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line no-console
    console.error(`Failed to start inventory-api: ${message}`);
    process.exitCode = 1;
    // Ensure we do not leave a dangling DB connection on a failed startup.
    void prisma.$disconnect();
  });
}

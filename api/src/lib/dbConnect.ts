/**
 * Database connection verification used during bootstrap.
 *
 * Kept separate from the Prisma singleton (`lib/prisma.ts`) so it can be unit
 * tested with a stub client without instantiating a real {@link PrismaClient}
 * (which requires a generated engine). The bootstrap in `index.ts` calls
 * {@link verifyDatabaseConnection} against the shared singleton.
 *
 * Satisfies Req 24.3: fail to start within ~10s if the local database is
 * unreachable, without partially initializing request handling.
 */

/** Minimal surface of a Prisma-like client needed to verify connectivity. */
export interface ConnectableClient {
  $connect(): Promise<void>;
}

/** Maximum time to wait for the initial database connection (Req 24.3). */
export const DB_CONNECT_TIMEOUT_MS = 10_000;

/** Error thrown when the initial database connection cannot be established. */
export class DatabaseConnectionError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'DatabaseConnectionError';
  }
}

/**
 * Attempts to establish a database connection, rejecting if it does not
 * succeed within {@link DB_CONNECT_TIMEOUT_MS}.
 *
 * @param client - The client to connect with (Prisma singleton in production).
 * @param timeoutMs - Connection timeout in milliseconds.
 * @throws {DatabaseConnectionError} If the connection fails or times out.
 */
export async function verifyDatabaseConnection(
  client: ConnectableClient,
  timeoutMs: number = DB_CONNECT_TIMEOUT_MS,
): Promise<void> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(
        new DatabaseConnectionError(
          `Could not establish a database connection within ${timeoutMs}ms. ` +
            'Verify DATABASE_URL and that the database is running and reachable.',
        ),
      );
    }, timeoutMs);
    // Do not keep the event loop alive solely for this timer.
    timer.unref?.();
  });

  try {
    await Promise.race([client.$connect(), timeout]);
  } catch (err) {
    if (err instanceof DatabaseConnectionError) {
      throw err;
    }
    throw new DatabaseConnectionError(
      'Could not establish a database connection. ' +
        'Verify DATABASE_URL and that the database is running and reachable.',
      { cause: err },
    );
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
  }
}

/**
 * Environment configuration loader and validator (fail-fast).
 *
 * Loads variables from a `.env` file via dotenv, then validates that every
 * required variable is present and non-empty. If any required variable is
 * absent or empty, {@link loadConfig} throws an {@link EnvValidationError}
 * that names the offending variable(s) â€” the bootstrap in `index.ts` uses this
 * to abort startup before any request handling is initialized.
 *
 * Satisfies:
 * - Req 14.2: all configuration read from environment variables via `.env`.
 * - Req 14.3: no literal secrets in source; values come only from the environment.
 * - Req 14.4 / Property 26: missing or empty required var aborts startup with a
 *   message identifying the variable by name.
 */

import dotenv from 'dotenv';

/** Error thrown when one or more required environment variables are missing/empty. */
export class EnvValidationError extends Error {
  /** The names of the variables that were absent or empty. */
  public readonly missing: readonly string[];

  constructor(missing: readonly string[]) {
    const names = missing.join(', ');
    super(
      `Missing or empty required environment variable(s): ${names}. ` +
        'Set these in your .env file or environment before starting the API.',
    );
    this.name = 'EnvValidationError';
    this.missing = [...missing];
  }
}

/** Typed, validated application configuration. */
export interface AppConfig {
  /** PostgreSQL connection string (Prisma `DATABASE_URL`). */
  readonly databaseUrl: string;
  /** HTTP server listening port. */
  readonly port: number;
  /** Allowed CORS origins (parsed from a comma-separated list). */
  readonly allowedOrigins: readonly string[];
  /** AWS configuration/credentials used by S3 and Cognito integrations. */
  readonly aws: {
    readonly region: string;
    readonly accessKeyId: string;
    readonly secretAccessKey: string;
  };
  /** Auth mode: 'dev' enables a local admin login without Cognito; 'cognito' (default) uses real JWT verification. */
  readonly authMode: 'dev' | 'cognito';
}

/**
 * The required environment variables. Each must be present and non-empty
 * (after trimming) or startup is aborted (Req 14.4).
 */
const REQUIRED_VARS = [
  'DATABASE_URL',
  'PORT',
  'ALLOWED_ORIGINS',
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
] as const;

type RequiredVar = (typeof REQUIRED_VARS)[number];

/** Reads a variable from the source, treating whitespace-only values as empty. */
function readVar(source: NodeJS.ProcessEnv, name: RequiredVar): string {
  const raw = source[name];
  return typeof raw === 'string' ? raw.trim() : '';
}

/**
 * Validates and builds the {@link AppConfig} from the given environment source.
 *
 * @param source - The environment to read from (defaults to `process.env`).
 * @param options - When `loadDotenv` is true (default), a `.env` file is loaded
 *   into `process.env` before validation.
 * @throws {EnvValidationError} If any required variable is absent or empty.
 * @throws {Error} If a present variable holds a structurally invalid value
 *   (e.g. PORT is not a valid TCP port, ALLOWED_ORIGINS has no usable entries).
 */
export function loadConfig(
  source: NodeJS.ProcessEnv = process.env,
  options: { loadDotenv?: boolean } = {},
): AppConfig {
  const { loadDotenv = true } = options;
  if (loadDotenv) {
    // Populate process.env from .env without overriding already-set variables.
    dotenv.config();
  }

  // Collect all missing/empty required variables so the error names every one.
  const missing = REQUIRED_VARS.filter((name) => readVar(source, name) === '');
  if (missing.length > 0) {
    throw new EnvValidationError(missing);
  }

  const portRaw = readVar(source, 'PORT');
  const port = Number(portRaw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(
      `Invalid PORT value "${portRaw}": expected an integer between 1 and 65535.`,
    );
  }

  const allowedOrigins = readVar(source, 'ALLOWED_ORIGINS')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
  if (allowedOrigins.length === 0) {
    throw new Error(
      'Invalid ALLOWED_ORIGINS value: expected a comma-separated list with at least one origin.',
    );
  }

  return {
    databaseUrl: readVar(source, 'DATABASE_URL'),
    port,
    allowedOrigins,
    aws: {
      region: readVar(source, 'AWS_REGION'),
      accessKeyId: readVar(source, 'AWS_ACCESS_KEY_ID'),
      secretAccessKey: readVar(source, 'AWS_SECRET_ACCESS_KEY'),
    },
    authMode: (source.AUTH_MODE ?? '').trim().toLowerCase() === 'dev' ? 'dev' : 'cognito',
  };
}

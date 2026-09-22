/**
 * Centralized error handler (Req 14.7, 23.5, 23.7, Property 30).
 *
 * Maps thrown errors to sanitized HTTP responses. Client-facing bodies never
 * contain stack traces, internal file-system paths, or secret values. Every
 * response carries `X-Content-Type-Options: nosniff` (Req 23.5).
 *
 * Recognized error types:
 * - {@link HttpError} subclasses → their `status` and message (+ `fields`).
 * - Express body-parser "entity too large" → 413 (Req 16.4).
 * - Anything else → 500 with a generic message (details are logged, not sent).
 */

import type { NextFunction, Request, Response } from 'express';

import { logger } from '../config/logger';
import { HttpError } from '../lib/errors';

/** Body shape returned for errors. */
interface ErrorBody {
  error: string;
  fields?: readonly { field: string; message: string }[];
}

/** Type guard for the body-parser payload-too-large error. */
function isPayloadTooLarge(err: unknown): boolean {
  return (
    typeof err === 'object' &&
    err !== null &&
    ('type' in err && (err as { type?: string }).type === 'entity.too.large' ||
      'status' in err && (err as { status?: number }).status === 413)
  );
}

/**
 * Express error-handling middleware. Must be registered last and keep the
 * four-argument signature so Express recognizes it as an error handler.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  // Always set nosniff, even on errors (Property 30 / Req 23.5).
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (err instanceof HttpError) {
    const body: ErrorBody = { error: err.message };
    if (err.fields) {
      body.fields = err.fields;
    }
    res.status(err.status).json(body);
    return;
  }

  if (isPayloadTooLarge(err)) {
    res.status(413).json({ error: 'Payload too large' });
    return;
  }

  // Unexpected error: log full detail server-side, return a sanitized body.
  logger.error({ err }, 'unhandled error');
  res.status(500).json({ error: 'Internal server error' });
}

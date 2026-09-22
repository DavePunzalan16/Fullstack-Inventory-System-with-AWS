/**
 * Request logging middleware (Req 22.2, Property 29).
 *
 * Emits a structured log entry for every request containing the HTTP method,
 * request path, response status code, and response time in milliseconds. The
 * entry is emitted on the response `finish`/`close` event, i.e. before the
 * response is fully sent to the client from the app's perspective.
 */

import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { logger as defaultLogger, type Logger } from '../config/logger';

/** Shape of the completion log entry (kept explicit for the property test). */
export interface RequestLogEntry {
  readonly method: string;
  readonly path: string;
  readonly status: number;
  readonly responseTimeMs: number;
}

/** Builds request-logging middleware using the given logger. */
export function createRequestLogger(logger: Logger = defaultLogger): RequestHandler {
  return function requestLogger(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const start = process.hrtime.bigint();
    let logged = false;

    const emit = (): void => {
      if (logged) {
        return;
      }
      logged = true;
      const elapsedNs = Number(process.hrtime.bigint() - start);
      const entry: RequestLogEntry = {
        method: req.method,
        path: req.path,
        status: res.statusCode,
        responseTimeMs: elapsedNs / 1_000_000,
      };
      logger.info(entry, 'request completed');
    };

    res.on('finish', emit);
    res.on('close', emit);
    next();
  };
}

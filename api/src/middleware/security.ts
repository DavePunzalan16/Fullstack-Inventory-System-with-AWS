/**
 * Security headers, CORS, and body-size limiting (Req 14.5, 14.6, 16.4, 23.5, 23.6).
 *
 * - helmet sets hardening headers including `X-Content-Type-Options: nosniff`
 *   (Property 30 / Req 23.5).
 * - CORS is restricted to the configured deployed origin(s) plus any localhost
 *   origin (Property 27 / Req 14.5, 14.6, 23.6). The origin decision is exposed
 *   as the pure function {@link isOriginAllowed} so it can be property-tested.
 * - JSON/urlencoded bodies are capped at 1 MB; oversized bodies yield 413
 *   (Req 16.4) via the error handler.
 */

import cors, { type CorsOptions } from 'cors';
import express, { type RequestHandler } from 'express';
import helmet from 'helmet';

import type { AppConfig } from '../config/env';

/** Matches any localhost / loopback origin regardless of port or scheme. */
const LOCALHOST_ORIGIN = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i;

/**
 * Decides whether a request `Origin` is permitted by CORS.
 *
 * A request with no `Origin` header (same-origin or non-browser client) is
 * permitted. Otherwise the origin must exactly match a configured allowed
 * origin, or match a localhost/loopback origin.
 *
 * @param origin - The request `Origin` header value (or undefined).
 * @param allowedOrigins - Configured deployed frontend origins.
 * @returns True if the origin should receive permissive CORS headers.
 */
export function isOriginAllowed(
  origin: string | undefined,
  allowedOrigins: readonly string[],
): boolean {
  if (origin === undefined || origin === '') {
    return true;
  }
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  return LOCALHOST_ORIGIN.test(origin);
}

/** Builds the cors options bound to the configured allowed origins. */
export function buildCorsOptions(config: AppConfig): CorsOptions {
  return {
    origin(origin, callback) {
      if (isOriginAllowed(origin ?? undefined, config.allowedOrigins)) {
        // `true` reflects the request origin; disallowed origins get no
        // Access-Control-Allow-Origin header, so the browser blocks the read.
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
  };
}

/** The maximum accepted request body size (Req 16.4). */
export const BODY_SIZE_LIMIT = '1mb';

/** Returns the ordered security middleware chain for the app. */
export function securityMiddleware(config: AppConfig): RequestHandler[] {
  return [
    helmet(),
    // Ensure nosniff is present on every response (Property 30 / Req 23.5).
    (_req, res, next) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      next();
    },
    cors(buildCorsOptions(config)),
    express.json({ limit: BODY_SIZE_LIMIT }),
    express.urlencoded({ extended: true, limit: BODY_SIZE_LIMIT }),
  ];
}

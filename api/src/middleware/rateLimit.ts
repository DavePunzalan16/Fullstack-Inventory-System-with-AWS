/**
 * Per-IP rate limiting (Req 17.1–17.4, Property 28).
 *
 * Applied globally to all routes except `/health`. Window and max are
 * configurable via the environment (`RATE_LIMIT_WINDOW_MS`,
 * `RATE_LIMIT_MAX`), defaulting to 15 minutes / 100 requests per IP.
 * When the limit is exceeded the response is 429 with a `Retry-After`
 * indication (Req 17.3).
 */

import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';

/** Default window: 15 minutes (Req 17.1). */
export const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
/** Default maximum requests per window per IP (Req 17.1). */
export const DEFAULT_MAX = 100;

/** Resolved rate-limit configuration. */
export interface RateLimitConfig {
  readonly windowMs: number;
  readonly max: number;
}

/**
 * Resolves the rate-limit configuration from environment variables, applying
 * defaults for absent/invalid values (Req 17.4).
 */
export function resolveRateLimitConfig(
  source: NodeJS.ProcessEnv = process.env,
): RateLimitConfig {
  const windowMs = Number(source.RATE_LIMIT_WINDOW_MS);
  const max = Number(source.RATE_LIMIT_MAX);
  return {
    windowMs:
      Number.isInteger(windowMs) && windowMs > 0 ? windowMs : DEFAULT_WINDOW_MS,
    max: Number.isInteger(max) && max > 0 ? max : DEFAULT_MAX,
  };
}

/** Builds the rate-limiting middleware, skipping the `/health` endpoint. */
export function buildRateLimiter(
  config: RateLimitConfig = resolveRateLimitConfig(),
): RateLimitRequestHandler {
  return rateLimit({
    windowMs: config.windowMs,
    max: config.max,
    standardHeaders: true, // adds RateLimit + Retry-After headers (Req 17.3)
    legacyHeaders: false,
    skip: (req) => req.path === '/health',
    message: { error: 'Too many requests. Please retry later.' },
  });
}

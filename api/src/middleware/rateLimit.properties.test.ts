/**
 * Property-based test for rate-limit config resolution (Property 28, Req 17.4).
 * The windowed enforcement behavior itself is covered by integration tests;
 * here we verify env-driven configuration resolution with defaults.
 */

import fc from 'fast-check';

import {
  DEFAULT_MAX,
  DEFAULT_WINDOW_MS,
  resolveRateLimitConfig,
} from './rateLimit';

// Feature: inventory-management-dashboard, Property 28: Rate limiting per window
test('Property 28: valid env overrides apply; invalid/absent values fall back to defaults', () => {
  fc.assert(
    fc.property(
      fc.option(fc.integer({ min: 1, max: 3_600_000 }), { nil: undefined }),
      fc.option(fc.integer({ min: 1, max: 10_000 }), { nil: undefined }),
      fc.option(fc.constantFrom('', 'abc', '-5', '0'), { nil: undefined }),
      (windowMs, max, garbage) => {
        const env: NodeJS.ProcessEnv = {};
        if (windowMs !== undefined) env.RATE_LIMIT_WINDOW_MS = String(windowMs);
        else if (garbage !== undefined) env.RATE_LIMIT_WINDOW_MS = garbage;
        if (max !== undefined) env.RATE_LIMIT_MAX = String(max);
        else if (garbage !== undefined) env.RATE_LIMIT_MAX = garbage;

        const cfg = resolveRateLimitConfig(env);
        const expectedWindow = windowMs ?? DEFAULT_WINDOW_MS;
        const expectedMax = max ?? DEFAULT_MAX;
        return cfg.windowMs === expectedWindow && cfg.max === expectedMax;
      },
    ),
    { numRuns: 200 },
  );
});

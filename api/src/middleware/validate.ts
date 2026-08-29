/**
 * Zod-based request validation and input sanitization (Req 16.1–16.3,
 * Properties 24, 25).
 *
 * `validate({ body, query, params })` runs the given Zod schemas before any
 * handler. On failure it produces a 400 with per-field errors and executes no
 * handler logic (Property 24). All string inputs are additionally bounded at
 * 10,000 characters and sanitized so stored/reflected values contain no
 * executable script or query syntax (Property 25 / Req 16.3).
 */

import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { z, type ZodTypeAny } from 'zod';

import { ValidationError, type FieldError } from '../lib/errors';

/** Maximum accepted length for any single string field (Req 16.3). */
export const MAX_STRING_LENGTH = 10_000;

/**
 * Neutralizes control characters and markup so a stored/reflected string
 * cannot carry executable script or query syntax (Req 16.3).
 *
 * - Strips ASCII control characters (except common whitespace).
 * - Escapes HTML-significant characters (`< > & " '`).
 */
export function sanitizeString(value: string): string {
  // eslint-disable-next-line no-control-regex
  const withoutControls = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  return withoutControls
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** True if any string anywhere in the value exceeds {@link MAX_STRING_LENGTH}. */
export function hasOverlongString(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.length > MAX_STRING_LENGTH;
  }
  if (Array.isArray(value)) {
    return value.some(hasOverlongString);
  }
  if (value !== null && typeof value === 'object') {
    return Object.values(value).some(hasOverlongString);
  }
  return false;
}

/** Recursively sanitizes all string values within a parsed object. */
export function sanitizeDeep<T>(value: T): T {
  if (typeof value === 'string') {
    return sanitizeString(value) as unknown as T;
  }
  if (Array.isArray(value)) {
    return value.map((v) => sanitizeDeep(v)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = sanitizeDeep(v);
    }
    return out as T;
  }
  return value;
}

/** Maps ZodError issues to our per-field error shape. */
export function toFieldErrors(error: z.ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || '(root)',
    message: issue.message,
  }));
}

/** The three request segments that can be validated. */
export interface ValidationSchemas {
  readonly body?: ZodTypeAny;
  readonly query?: ZodTypeAny;
  readonly params?: ZodTypeAny;
}

type Segment = keyof ValidationSchemas;

/**
 * Builds validation middleware for the provided schemas.
 *
 * On success, the parsed-and-sanitized values replace `req.body`/`req.query`/
 * `req.params`. On any failure a {@link ValidationError} (400) is passed to the
 * error handler and no downstream handler runs.
 */
export function validate(schemas: ValidationSchemas): RequestHandler {
  const segments: Segment[] = ['body', 'query', 'params'];

  return function runValidation(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void {
    const fieldErrors: FieldError[] = [];

    for (const segment of segments) {
      const schema = schemas[segment];
      if (schema === undefined) {
        continue;
      }
      const raw = req[segment];

      // Length guard first so oversized payloads are rejected regardless of schema (Req 16.3).
      if (hasOverlongString(raw)) {
        fieldErrors.push({
          field: segment,
          message: `String fields must not exceed ${MAX_STRING_LENGTH} characters`,
        });
        continue;
      }

      const result = schema.safeParse(raw);
      if (!result.success) {
        fieldErrors.push(
          ...toFieldErrors(result.error).map((fe) => ({
            field: `${segment}.${fe.field}`,
            message: fe.message,
          })),
        );
        continue;
      }

      // Replace with the sanitized, parsed value.
      const sanitized = sanitizeDeep(result.data);
      // req.query/params are typed as read-only-ish; assign via cast.
      (req as unknown as Record<Segment, unknown>)[segment] = sanitized;
    }

    if (fieldErrors.length > 0) {
      next(new ValidationError(fieldErrors));
      return;
    }
    next();
  };
}

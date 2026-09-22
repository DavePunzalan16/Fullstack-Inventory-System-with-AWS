/**
 * Domain error hierarchy.
 *
 * Services and controllers throw these typed errors; the centralized error
 * handler (`middleware/error.ts`) maps them to sanitized HTTP responses
 * (Req 23.7, Property 30). No stack traces, file paths, or secrets are ever
 * placed in the client-facing message of these errors.
 */

/** A field-level validation problem. */
export interface FieldError {
  readonly field: string;
  readonly message: string;
}

/** Base class for errors that map to a specific HTTP status. */
export class HttpError extends Error {
  /** HTTP status code to send. */
  public readonly status: number;
  /** Optional per-field errors (for 400 responses). */
  public readonly fields?: readonly FieldError[];

  constructor(status: number, message: string, fields?: readonly FieldError[]) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    if (fields) {
      this.fields = fields;
    }
  }
}

/** 400 Bad Request — schema/validation failure (Req 16.2). */
export class ValidationError extends HttpError {
  constructor(fields: readonly FieldError[], message = 'Validation failed') {
    super(400, message, fields);
  }
}

/** 401 Unauthorized — missing/invalid/expired token (Req 11.8, 11.9, 12.2). */
export class UnauthorizedError extends HttpError {
  constructor(message = 'Unauthorized') {
    super(401, message);
  }
}

/** 403 Forbidden — role not permitted (Req 12.3, 12.6). */
export class ForbiddenError extends HttpError {
  constructor(message = 'Forbidden: action not permitted for role') {
    super(403, message);
  }
}

/** 404 Not Found — referenced resource does not exist (Req 4.8, 26.4). */
export class NotFoundError extends HttpError {
  constructor(message = 'Not found') {
    super(404, message);
  }
}

/** 409 Conflict — uniqueness violation such as duplicate SKU (Req 4.6). */
export class ConflictError extends HttpError {
  constructor(message = 'Conflict') {
    super(409, message);
  }
}

/** 413 Payload Too Large — request body exceeds the size limit (Req 16.4). */
export class PayloadTooLargeError extends HttpError {
  constructor(message = 'Payload too large') {
    super(413, message);
  }
}

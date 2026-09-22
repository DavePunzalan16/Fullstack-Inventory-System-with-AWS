/**
 * Structured logger (pino), CloudWatch-friendly (Req 22.1, 22.2).
 *
 * Emits single-line JSON log entries suitable for shipping to CloudWatch.
 * The request-logging middleware (`middleware/requestLogger.ts`) uses this
 * logger to record method, path, status, and response time (Property 29).
 */

import pino from 'pino';

/** The shared application logger. */
export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  // Redact anything that could leak a secret in structured fields (Req 23.7).
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      'accessKeyId',
      'secretAccessKey',
    ],
    censor: '[REDACTED]',
  },
});

export type Logger = typeof logger;

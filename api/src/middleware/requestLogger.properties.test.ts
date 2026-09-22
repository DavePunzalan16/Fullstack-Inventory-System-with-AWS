/**
 * Property-based test for request logging completeness (Property 29).
 */

import { EventEmitter } from 'events';

import fc from 'fast-check';

import { createRequestLogger, type RequestLogEntry } from './requestLogger';
import type { Logger } from '../config/logger';

// Feature: inventory-management-dashboard, Property 29: Request logging completeness
test('Property 29: a completion log carries method, path, status, and responseTimeMs', () => {
  fc.assert(
    fc.property(
      fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
      fc.string({ minLength: 1, maxLength: 30 }).map((s) => `/${s}`),
      fc.integer({ min: 100, max: 599 }),
      (method, path, status) => {
        const entries: RequestLogEntry[] = [];
        const fakeLogger = {
          info: (obj: RequestLogEntry) => entries.push(obj),
        } as unknown as Logger;

        const mw = createRequestLogger(fakeLogger);
        const req = { method, path } as never;
        const res = new EventEmitter() as never as {
          statusCode: number;
          on: EventEmitter['on'];
        };
        res.statusCode = status;

        let nextCalled = false;
        mw(req, res as never, () => {
          nextCalled = true;
        });
        // Simulate response completion.
        (res as unknown as EventEmitter).emit('finish');

        if (!nextCalled || entries.length !== 1) return false;
        const e = entries[0];
        return (
          e.method === method &&
          e.path === path &&
          e.status === status &&
          typeof e.responseTimeMs === 'number' &&
          e.responseTimeMs >= 0
        );
      },
    ),
    { numRuns: 200 },
  );
});

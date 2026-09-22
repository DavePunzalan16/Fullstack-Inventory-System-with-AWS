/**
 * Property-based test for image validation decision (Property 18).
 */

import fc from 'fast-check';

import { MAX_IMAGE_BYTES, validateImage } from './s3';

/** Magic-byte prefixes for the accepted formats. */
const JPEG = [0xff, 0xd8, 0xff];
const PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const RIFF = [0x52, 0x49, 0x46, 0x46];
const WEBP = [0x57, 0x45, 0x42, 0x50];

function buildValid(format: 'jpeg' | 'png' | 'webp', extra: number): Buffer {
  const filler = Buffer.alloc(Math.max(0, extra), 0x20);
  if (format === 'jpeg') return Buffer.concat([Buffer.from(JPEG), filler]);
  if (format === 'png') return Buffer.concat([Buffer.from(PNG), filler]);
  // webp: RIFF <4 bytes size> WEBP
  return Buffer.concat([Buffer.from(RIFF), Buffer.from([0, 0, 0, 0]), Buffer.from(WEBP), filler]);
}

// Feature: inventory-management-dashboard, Property 18: Image validation decision
test('Property 18: accepted iff 0<size<=5MB and format in {jpeg,png,webp}', () => {
  const validArb = fc
    .tuple(fc.constantFrom('jpeg', 'png', 'webp'), fc.integer({ min: 0, max: 2000 }))
    .map(([fmt, extra]) => ({ buffer: buildValid(fmt as 'jpeg', extra), expectOk: true }));

  const emptyArb = fc.constant({ buffer: Buffer.alloc(0), expectOk: false });

  const badFormatArb = fc
    .uint8Array({ minLength: 12, maxLength: 40 })
    .map((arr) => {
      const b = Buffer.from(arr);
      // Force a non-matching header.
      b[0] = 0x00;
      b[1] = 0x01;
      b[2] = 0x02;
      return { buffer: b, expectOk: false };
    });

  fc.assert(
    fc.property(fc.oneof(validArb, emptyArb, badFormatArb), ({ buffer, expectOk }) => {
      const result = validateImage(buffer);
      if (result.ok !== expectOk) return false;
      if (!result.ok) return typeof result.reason === 'string' && result.reason.length > 0;
      return true;
    }),
    { numRuns: 300 },
  );

  // Oversized valid-format image is rejected.
  const oversized = Buffer.concat([Buffer.from(JPEG), Buffer.alloc(MAX_IMAGE_BYTES)]);
  expect(validateImage(oversized).ok).toBe(false);
});

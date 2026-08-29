/**
 * S3 upload helper and image validation (Req 5.1–5.4, Property 18).
 *
 * Image validation (size + format via magic bytes) is a pure function so it
 * can be property-tested. Uploading is isolated behind {@link uploadObject}
 * so services depend on a small surface that tests can mock.
 */

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

/** Maximum accepted image size: 5 MB (Req 5.2). */
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

/** Accepted image formats (Req 5.2). */
export type ImageFormat = 'jpeg' | 'png' | 'webp';

/** Result of validating an uploaded image. */
export type ImageValidation =
  | { readonly ok: true; readonly format: ImageFormat }
  | { readonly ok: false; readonly reason: string };

/** Detects image format from magic bytes; undefined if unrecognized. */
export function detectImageFormat(buffer: Buffer): ImageFormat | undefined {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return 'jpeg';
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return 'png';
  }
  // WebP: "RIFF" .... "WEBP"
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'webp';
  }
  return undefined;
}

/**
 * Validates an uploaded image buffer (Property 18 / Req 5.2, 5.3).
 * Accepted iff size > 0 and <= 5 MB AND format is JPEG/PNG/WebP.
 */
export function validateImage(buffer: Buffer): ImageValidation {
  if (buffer.length === 0) {
    return { ok: false, reason: 'Image file is empty (0 bytes)' };
  }
  if (buffer.length > MAX_IMAGE_BYTES) {
    return { ok: false, reason: 'Image exceeds the 5 MB size limit' };
  }
  const format = detectImageFormat(buffer);
  if (format === undefined) {
    return { ok: false, reason: 'Unsupported format; expected JPEG, PNG, or WebP' };
  }
  return { ok: true, format };
}

/** Configuration for the S3 helper. */
export interface S3Config {
  readonly region: string;
  readonly bucket: string;
  readonly accessKeyId: string;
  readonly secretAccessKey: string;
}

/** Reads S3 configuration from the environment. */
export function s3ConfigFromEnv(source: NodeJS.ProcessEnv = process.env): S3Config {
  return {
    region: source.AWS_REGION?.trim() ?? '',
    bucket: source.S3_BUCKET?.trim() ?? '',
    accessKeyId: source.AWS_ACCESS_KEY_ID?.trim() ?? '',
    secretAccessKey: source.AWS_SECRET_ACCESS_KEY?.trim() ?? '',
  };
}

/** Uploads an object and returns its public URL. */
export interface ObjectUploader {
  upload(key: string, body: Buffer, contentType: string): Promise<string>;
}

/** Builds an S3-backed {@link ObjectUploader}. */
export function createS3Uploader(config: S3Config): ObjectUploader {
  const client = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  return {
    async upload(key, body, contentType): Promise<string> {
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
      return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
    },
  };
}

/** MIME content type for a validated image format. */
export function contentTypeFor(format: ImageFormat): string {
  return `image/${format === 'jpeg' ? 'jpeg' : format}`;
}

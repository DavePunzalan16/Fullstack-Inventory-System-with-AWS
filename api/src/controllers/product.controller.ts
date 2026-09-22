/**
 * Product controllers (Req 4.x, 3.x, 5.x, 8.5).
 *
 * Controllers orchestrate request/response only; business logic lives in the
 * product service. Errors are thrown (async-wrapped) and handled centrally.
 */

import type { NextFunction, Request, Response } from 'express';

import { NotFoundError } from '../lib/errors';
import { HttpError } from '../lib/errors';
import {
  contentTypeFor,
  createS3Uploader,
  s3ConfigFromEnv,
  validateImage,
  type ObjectUploader,
} from '../lib/s3';
import { ValidationError } from '../lib/errors';
import * as productService from '../services/product.service';
import type {
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from '../schemas/product.schema';

/** Wraps an async handler so thrown/rejected errors reach the error handler. */
function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}

export const create = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body as CreateProductInput);
  res.status(201).json(product);
});

export const update = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const product = await productService.updateProduct(id, req.body as UpdateProductInput);
  res.status(200).json(product);
});

export const remove = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  await productService.deleteProduct(id);
  res.status(204).send();
});

export const getById = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const product = await productService.getProduct(id);
  res.status(200).json(product);
});

export const list = asyncHandler(async (req, res) => {
  const result = await productService.listProducts(
    req.query as unknown as ListProductsQuery,
  );
  res.status(200).json(result);
});

export const search = asyncHandler(async (req, res) => {
  const { q } = req.query as unknown as { q: string };
  const results = await productService.searchProducts(q);
  res.status(200).json(results);
});

/**
 * Image upload controller factory (Req 5.1–5.4, Property 18).
 * The uploader is injectable so tests can simulate S3 success/failure without
 * network access.
 */
export function uploadImageController(uploader?: ObjectUploader) {
  const resolveUploader = (): ObjectUploader =>
    uploader ?? createS3Uploader(s3ConfigFromEnv());

  return asyncHandler(async (req, res) => {
    const { id } = req.params as { id: string };

    // Confirm the product exists before touching storage (Req 5.4 semantics).
    await productService.getProduct(id).catch((err) => {
      if (err instanceof NotFoundError) throw err;
      throw err;
    });

    const file = (req as Request & { file?: { buffer: Buffer } }).file;
    if (file === undefined) {
      throw new ValidationError([{ field: 'image', message: 'image file is required' }]);
    }

    const validation = validateImage(file.buffer);
    if (!validation.ok) {
      throw new ValidationError([{ field: 'image', message: validation.reason }]);
    }

    const key = `products/${id}/${Date.now()}.${validation.format}`;
    let url: string;
    try {
      url = await resolveUploader().upload(
        key,
        file.buffer,
        contentTypeFor(validation.format),
      );
    } catch {
      // S3 failure: 500, imageUrl unchanged (Req 5.4).
      throw new HttpError(500, 'Failed to store image');
    }

    const product = await productService.setProductImageUrl(id, url);
    res.status(200).json(product);
  });
}

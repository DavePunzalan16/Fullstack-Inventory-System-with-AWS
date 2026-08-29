/**
 * Product routes (Req 4.x, 3.x, 5.x, 8.5).
 *
 * Route definitions only — no business logic. Reads allow Admin or Staff;
 * writes require Admin. Validation runs before controllers. The search route
 * is declared before `/products/:id` so `search` is not captured as an id.
 */

import { Router } from 'express';
import multer from 'multer';

import * as controller from '../controllers/product.controller';
import { requireRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import {
  createProductSchema,
  listProductsQuerySchema,
  productIdParamSchema,
  searchQuerySchema,
  updateProductSchema,
} from '../schemas/product.schema';

/** In-memory upload storage; the controller validates size/format explicitly. */
const upload = multer({ storage: multer.memoryStorage() });

/** Builds the product router. */
export function productRouter(): Router {
  const router = Router();

  router.get('/products/search', requireRole('admin', 'staff'), validate({ query: searchQuerySchema }), controller.search);

  router.get('/products', requireRole('admin', 'staff'), validate({ query: listProductsQuerySchema }), controller.list);

  router.get('/products/:id', requireRole('admin', 'staff'), validate({ params: productIdParamSchema }), controller.getById);

  router.post('/products', requireRole('admin'), validate({ body: createProductSchema }), controller.create);

  router.put('/products/:id', requireRole('admin'), validate({ params: productIdParamSchema, body: updateProductSchema }), controller.update);

  router.delete('/products/:id', requireRole('admin'), validate({ params: productIdParamSchema }), controller.remove);

  router.post(
    '/products/:id/image',
    requireRole('admin'),
    validate({ params: productIdParamSchema }),
    upload.single('image'),
    controller.uploadImageController(),
  );

  return router;
}

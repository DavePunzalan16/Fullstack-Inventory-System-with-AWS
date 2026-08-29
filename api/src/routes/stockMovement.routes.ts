/**
 * Stock movement routes (Req 26.x).
 * Read allows Admin/Staff; create requires Admin (write).
 */

import { Router } from 'express';

import * as controller from '../controllers/stockMovement.controller';
import { requireRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import {
  createStockMovementSchema,
  listMovementsQuerySchema,
  productIdParamSchema,
} from '../schemas/stockMovement.schema';

/** Builds the stock-movement router. */
export function stockMovementRouter(): Router {
  const router = Router();

  router.get(
    '/products/:id/stock-movements',
    requireRole('admin', 'staff'),
    validate({ params: productIdParamSchema, query: listMovementsQuerySchema }),
    controller.list,
  );

  router.post(
    '/products/:id/stock-movements',
    requireRole('admin'),
    validate({ params: productIdParamSchema, body: createStockMovementSchema }),
    controller.create,
  );

  return router;
}

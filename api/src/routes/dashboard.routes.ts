/**
 * Dashboard routes (Req 1.x, 2.x). All read-only (Admin/Staff).
 */

import { Router } from 'express';

import * as controller from '../controllers/dashboard.controller';
import { requireRole } from '../middleware/authorize';

/** Builds the dashboard router. */
export function dashboardRouter(): Router {
  const router = Router();
  const read = requireRole('admin', 'staff');

  router.get('/dashboard/summary', read, controller.summary);
  router.get('/dashboard/trends', read, controller.trends);
  router.get('/dashboard/expense-breakdown', read, controller.expenseBreakdown);
  router.get('/dashboard/popular-products', read, controller.popularProducts);

  return router;
}

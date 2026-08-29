/**
 * User routes (Req 6.1, 6.4). Both endpoints are read-only (Admin/Staff).
 * The Users management page is UI-gated to Admin on the frontend (Req 6.5).
 */

import { Router } from 'express';

import * as controller from '../controllers/user.controller';
import { requireRole } from '../middleware/authorize';

/** Builds the user router. */
export function userRouter(): Router {
  const router = Router();

  router.get('/users/me', requireRole('admin', 'staff'), controller.me);
  router.get('/users', requireRole('admin', 'staff'), controller.list);

  return router;
}

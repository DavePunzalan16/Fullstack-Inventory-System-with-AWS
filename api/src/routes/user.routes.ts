/**
 * User routes (Req 6.1, 6.4). Reads are Admin/Staff. PATCH /users/me lets any
 * authenticated user edit their own profile (Batch 3).
 */

import { Router } from 'express';

import * as controller from '../controllers/user.controller';
import { requireRole } from '../middleware/authorize';

/** Builds the user router. */
export function userRouter(): Router {
  const router = Router();

  router.get('/users/me', requireRole('admin', 'staff'), controller.me);
  router.patch('/users/me', requireRole('admin', 'staff'), controller.updateMe);
  router.get('/users', requireRole('admin', 'staff'), controller.list);

  return router;
}
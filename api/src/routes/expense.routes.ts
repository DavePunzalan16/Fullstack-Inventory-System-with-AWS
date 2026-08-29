/**
 * Expense routes (Req 7.x). Reads allow Admin/Staff; writes require Admin.
 */

import { Router } from 'express';

import * as controller from '../controllers/expense.controller';
import { requireRole } from '../middleware/authorize';
import { validate } from '../middleware/validate';
import {
  createExpenseSchema,
  expenseIdParamSchema,
  listExpensesQuerySchema,
} from '../schemas/expense.schema';

/** Builds the expense router. */
export function expenseRouter(): Router {
  const router = Router();

  router.get('/expenses/by-category', requireRole('admin', 'staff'), controller.byCategory);

  router.get('/expenses', requireRole('admin', 'staff'), validate({ query: listExpensesQuerySchema }), controller.list);

  router.post('/expenses', requireRole('admin'), validate({ body: createExpenseSchema }), controller.create);

  router.delete('/expenses/:id', requireRole('admin'), validate({ params: expenseIdParamSchema }), controller.remove);

  return router;
}

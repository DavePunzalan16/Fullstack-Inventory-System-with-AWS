/**
 * Expense controllers (Req 7.x).
 */

import type { NextFunction, Request, Response } from 'express';

import * as service from '../services/expense.service';
import type {
  CreateExpenseInput,
  ListExpensesQuery,
} from '../schemas/expense.schema';

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}

export const list = asyncHandler(async (req, res) => {
  const rows = await service.listExpenses(req.query as unknown as ListExpensesQuery);
  res.status(200).json(rows);
});

export const byCategory = asyncHandler(async (_req, res) => {
  const totals = await service.expensesByCategory();
  res.status(200).json(totals);
});

export const create = asyncHandler(async (req, res) => {
  const created = await service.createExpense(req.body as CreateExpenseInput);
  res.status(201).json(created);
});

export const remove = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  await service.deleteExpense(id);
  res.status(204).send();
});

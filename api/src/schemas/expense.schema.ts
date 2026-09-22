/**
 * Expense validation schemas (Req 7.7, 7.8, 7.3, 7.5).
 */

import { z } from 'zod';

/** Defined expense category set (Req 7.7). */
export const EXPENSE_CATEGORIES = [
  'Utilities',
  'Rent',
  'Salaries',
  'Supplies',
  'Marketing',
  'Maintenance',
  'Other',
] as const;

export const EXPENSE_BOUNDS = {
  amountMin: 0.01,
  amountMax: 999_999_999.99,
  notesMax: 500,
} as const;

/** Body schema for creating an expense (date not later than today, Req 7.7). */
export const createExpenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  amount: z.coerce
    .number()
    .min(EXPENSE_BOUNDS.amountMin, { message: 'amount must be between 0.01 and 999999999.99' })
    .max(EXPENSE_BOUNDS.amountMax, { message: 'amount must be between 0.01 and 999999999.99' }),
  date: z.coerce
    .date()
    .refine((d) => d.getTime() <= Date.now(), { message: 'date must not be later than today' }),
  notes: z.string().max(EXPENSE_BOUNDS.notesMax).optional().default(''),
});

/** Query schema for listing expenses with optional filters (Req 7.3, 7.5). */
export const listExpensesQuerySchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const expenseIdParamSchema = z.object({ id: z.string().min(1) });

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type ListExpensesQuery = z.infer<typeof listExpensesQuerySchema>;

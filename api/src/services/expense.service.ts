/**
 * Expense service (Req 7.3, 7.5, 7.6, 7.7, 7.9, Property 6).
 *
 * The category-breakdown aggregation is a pure exported helper: each category
 * maps to the sum of its amounts, and the sum of all segment values equals the
 * total of all amounts (Property 6).
 */

import { Prisma } from '@prisma/client';

import { NotFoundError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import type {
  CreateExpenseInput,
  ListExpensesQuery,
} from '../schemas/expense.schema';

/** An expense shape for the pure breakdown helper. */
export interface ExpenseLike {
  readonly category: string;
  readonly amount: number;
}

/** Rounds to 2 decimals using cents to avoid float drift. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Groups expenses by category, summing amounts (Property 6).
 * Returns a record of category → total (rounded to 2dp).
 */
export function categoryBreakdown(
  expenses: readonly ExpenseLike[],
): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const e of expenses) {
    totals[e.category] = round2((totals[e.category] ?? 0) + e.amount);
  }
  return totals;
}

/** Lists expenses with optional category and inclusive date-range filters. */
export async function listExpenses(query: ListExpensesQuery) {
  const where: Prisma.ExpenseWhereInput = {};
  if (query.category) where.category = query.category;
  if (query.startDate || query.endDate) {
    where.date = {};
    if (query.startDate) where.date.gte = query.startDate;
    if (query.endDate) where.date.lte = query.endDate;
  }
  return prisma.expense.findMany({ where, orderBy: { date: 'desc' } });
}

/** Returns category totals for the expense chart (Req 7.6). */
export async function expensesByCategory(): Promise<Record<string, number>> {
  const grouped = await prisma.expense.groupBy({
    by: ['category'],
    _sum: { amount: true },
  });
  const out: Record<string, number> = {};
  for (const g of grouped) {
    out[g.category] = round2(Number(g._sum.amount ?? 0));
  }
  return out;
}

/** Creates an expense (Req 7.7). */
export async function createExpense(input: CreateExpenseInput) {
  return prisma.expense.create({
    data: {
      category: input.category,
      amount: new Prisma.Decimal(input.amount),
      date: input.date,
      notes: input.notes ?? '',
    },
  });
}

/** Deletes an expense; 404 if missing (Req 7.9). */
export async function deleteExpense(id: string): Promise<void> {
  try {
    await prisma.expense.delete({ where: { id } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      throw new NotFoundError('Expense not found');
    }
    throw err;
  }
}

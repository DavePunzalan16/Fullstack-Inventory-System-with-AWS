'use client';

/**
 * Expenses page (Req 7.1–7.6): list with category/amount/date/notes, empty
 * state, category + date-range filters, category chart, and Admin create/delete.
 */

import { useState } from 'react';

import { ExpenseChart } from '@/components/expenses/ExpenseChart';
import { RoleGate } from '@/components/common/RoleGate';
import { EmptyState, ErrorState, LoadingState } from '@/components/common/States';
import {
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useGetExpensesByCategoryQuery,
  useGetExpensesQuery,
} from '@/state/api';
import type { ExpenseInput, ExpenseListQuery } from '@/types';

const CATEGORIES = ['Utilities', 'Rent', 'Salaries', 'Supplies', 'Marketing', 'Maintenance', 'Other'];

export default function ExpensesPage() {
  const [filter, setFilter] = useState<ExpenseListQuery>({});
  const { data: expenses, isLoading, isError } = useGetExpensesQuery(filter);
  const byCategory = useGetExpensesByCategoryQuery();
  const [createExpense] = useCreateExpenseMutation();
  const [deleteExpense] = useDeleteExpenseMutation();

  const [form, setForm] = useState<Partial<ExpenseInput>>({ category: 'Utilities' });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.amount || !form.date) return;
    await createExpense(form as ExpenseInput).unwrap().catch(() => undefined);
    setForm({ category: 'Utilities' });
  };

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-4xl text-white">Expenses</h1>

      <div className="flex flex-wrap gap-3">
        <select
          aria-label="Filter by category"
          value={filter.category ?? ''}
          onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value || undefined }))}
          className="rounded bg-surface px-3 py-2 text-white"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          type="date"
          aria-label="Start date"
          value={filter.startDate ?? ''}
          onChange={(e) => setFilter((f) => ({ ...f, startDate: e.target.value || undefined }))}
          className="rounded bg-surface px-3 py-2 text-white"
        />
        <input
          type="date"
          aria-label="End date"
          value={filter.endDate ?? ''}
          onChange={(e) => setFilter((f) => ({ ...f, endDate: e.target.value || undefined }))}
          className="rounded bg-surface px-3 py-2 text-white"
        />
      </div>

      <ExpenseChart data={byCategory.data} isLoading={byCategory.isLoading} isError={byCategory.isError} />

      <RoleGate>
        <form onSubmit={submit} className="flex flex-wrap items-end gap-3 rounded-md bg-surface p-4" aria-label="Add expense">
          <select
            aria-label="Category"
            value={form.category ?? 'Utilities'}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            className="rounded bg-background px-3 py-2 text-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input type="number" step="any" aria-label="Amount" placeholder="Amount"
            onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
            className="rounded bg-background px-3 py-2 text-white" />
          <input type="date" aria-label="Date"
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className="rounded bg-background px-3 py-2 text-white" />
          <input type="text" aria-label="Notes" placeholder="Notes"
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            className="rounded bg-background px-3 py-2 text-white" />
          <button type="submit" className="rounded-full bg-primary px-6 py-2 font-bold uppercase text-black">
            Add
          </button>
        </form>
      </RoleGate>

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState message="Could not load expenses." />
      ) : (expenses ?? []).length === 0 ? (
        <EmptyState message="No expenses match the applied filter." />
      ) : (
        <table className="w-full text-left text-sm text-offwhite">
          <thead>
            <tr className="border-b border-dark-gray text-white">
              <th className="py-2">Category</th>
              <th>Amount</th>
              <th>Date</th>
              <th>Notes</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {(expenses ?? []).map((ex) => (
              <tr key={ex.id} className="border-b border-dark-gray/50">
                <td className="py-2">{ex.category}</td>
                <td>${ex.amount}</td>
                <td>{new Date(ex.date).toLocaleDateString()}</td>
                <td>{ex.notes}</td>
                <td>
                  <RoleGate>
                    <button
                      type="button"
                      aria-label={`Delete expense ${ex.id}`}
                      onClick={() => deleteExpense(ex.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </RoleGate>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

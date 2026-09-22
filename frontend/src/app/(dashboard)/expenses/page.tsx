'use client';

/**
 * Expenses page (Req 7.1-7.6): filters, category chart, list with delete, and
 * an Admin-gated Add Expense modal. List/chart show connection-aware errors
 * with Retry; the empty list uses an illustration rather than a bare error.
 */

import { useState } from 'react';

import { ExpenseChart } from '@/components/expenses/ExpenseChart';
import { Modal } from '@/components/common/Modal';
import { RoleGate } from '@/components/common/RoleGate';
import { EmptyState, ErrorState, LoadingState, isConnectionError } from '@/components/common/States';
import { Toast } from '@/components/common/Toast';
import datahelix from '@/Assets/datahelix.png';
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
  const { data: expenses, isLoading, isError, error, refetch } = useGetExpensesQuery(filter);
  const byCategory = useGetExpensesByCategoryQuery();
  const [createExpense, { isLoading: creating }] = useCreateExpenseMutation();
  const [deleteExpense] = useDeleteExpenseMutation();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Partial<ExpenseInput>>({ category: 'Utilities' });
  const [toast, setToast] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.category || form.amount === undefined || form.amount <= 0 || !form.date) {
      setFormError('Category, a positive amount, and a date are required.');
      return;
    }
    try {
      await createExpense(form as ExpenseInput).unwrap();
      setForm({ category: 'Utilities' });
      setShowForm(false);
      setToast('Expense added.');
    } catch {
      setFormError('Could not save the expense. Please try again.');
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl text-white">Expenses</h1>
        <RoleGate>
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="rounded-full bg-primary px-6 py-2 font-bold uppercase text-black"
          >
            Add Expense
          </button>
        </RoleGate>
      </div>

      <div className="flex flex-wrap gap-3">
        <select
          aria-label="Filter by category"
          value={filter.category ?? ''}
          onChange={(e) => setFilter((f) => ({ ...f, category: e.target.value || undefined }))}
          className="rounded bg-surface px-3 py-2 text-white ring-1 ring-border/40"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
        </select>
        <input type="date" aria-label="Start date" value={filter.startDate ?? ''}
          onChange={(e) => setFilter((f) => ({ ...f, startDate: e.target.value || undefined }))}
          className="rounded bg-surface px-3 py-2 text-white ring-1 ring-border/40" />
        <input type="date" aria-label="End date" value={filter.endDate ?? ''}
          onChange={(e) => setFilter((f) => ({ ...f, endDate: e.target.value || undefined }))}
          className="rounded bg-surface px-3 py-2 text-white ring-1 ring-border/40" />
      </div>

      <ExpenseChart
        data={byCategory.data}
        isLoading={byCategory.isLoading}
        isError={byCategory.isError}
        error={byCategory.error}
        onRetry={byCategory.refetch}
      />

      {isLoading ? (
        <LoadingState label="Loading expenses…" />
      ) : isError ? (
        <ErrorState error={error} onRetry={refetch} message={isConnectionError(error) ? undefined : 'Could not load expenses.'} />
      ) : (expenses ?? []).length === 0 ? (
        <EmptyState illustration={datahelix} illustrationAlt="" message="No expenses yet. Use 'Add Expense' to log one." />
      ) : (
        <table className="w-full text-left text-sm text-secondary">
          <thead>
            <tr className="border-b border-dark-gray text-white">
              <th className="py-2">Category</th><th>Amount</th><th>Date</th><th>Notes</th><th />
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
                    <button type="button" aria-label={`Delete expense ${ex.id}`}
                      onClick={() => deleteExpense(ex.id)} className="text-red-400 hover:text-red-300">
                      Delete
                    </button>
                  </RoleGate>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <Modal title="Add Expense" isOpen={showForm} onClose={() => setShowForm(false)}>
        <form onSubmit={submit} className="flex flex-col gap-4" aria-label="Add expense">
          <label className="flex flex-col gap-1 text-sm text-secondary">
            Category
            <select aria-label="Category" value={form.category ?? 'Utilities'}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="rounded bg-background px-3 py-2 text-white ring-1 ring-border/40">
              {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm text-secondary">
            Amount
            <input type="number" step="any" min="0" aria-label="Amount" placeholder="0.00"
              value={form.amount ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, amount: Number(e.target.value) }))}
              className="rounded bg-background px-3 py-2 text-white ring-1 ring-border/40" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-secondary">
            Date
            <input type="date" aria-label="Date" value={form.date ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              className="rounded bg-background px-3 py-2 text-white ring-1 ring-border/40" />
          </label>
          <label className="flex flex-col gap-1 text-sm text-secondary">
            Note
            <input type="text" aria-label="Notes" placeholder="Optional note"
              value={form.notes ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="rounded bg-background px-3 py-2 text-white ring-1 ring-border/40" />
          </label>
          {formError && <p role="alert" className="text-sm text-red-400">{formError}</p>}
          <button type="submit" disabled={creating}
            className="rounded-full bg-primary px-6 py-2 font-bold uppercase text-black disabled:opacity-60">
            Save expense
          </button>
        </form>
      </Modal>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

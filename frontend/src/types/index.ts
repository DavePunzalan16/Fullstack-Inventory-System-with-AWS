/**
 * Shared frontend types (mirrors the API response shapes).
 */

/** User role. */
export type Role = 'admin' | 'staff';

/** Authenticated session user. */
export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

/** A product as returned by the API (with computed isLowStock). */
export interface Product {
  id: string;
  name: string;
  sku: string;
  price: string;
  stockQuantity: number;
  reorderThreshold: number;
  rating: string;
  categoryId: string;
  category?: { id: string; name: string };
  imageUrl: string | null;
  isLowStock: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Paginated product list response. */
export interface ProductListResponse {
  data: Product[];
  page: number;
  pageSize: number;
  total: number;
}

/** Query params for the product list. */
export interface ProductListQuery {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  name?: string;
  sku?: string;
  categoryId?: string;
}

/** Create/update product payload. */
export interface ProductInput {
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  reorderThreshold: number;
  rating: number;
  categoryId: string;
}

/** An expense record. */
export interface Expense {
  id: string;
  category: string;
  amount: string;
  date: string;
  notes: string | null;
}

/** Create expense payload. */
export interface ExpenseInput {
  category: string;
  amount: number;
  date: string;
  notes?: string;
}

/** Expense list filters. */
export interface ExpenseListQuery {
  category?: string;
  startDate?: string;
  endDate?: string;
}

/** Dashboard summary card values. */
export interface DashboardSummary {
  totalProducts: number;
  totalStockValue: string;
  lowStockCount: number;
  currentMonthExpenses: string;
}

/** A monthly trend bucket. */
export interface TrendBucket {
  year: number;
  month: number;
  total: number;
}

/** A popular product entry. */
export interface PopularProduct {
  id: string;
  name?: string;
  sku?: string;
  salesVolume: number;
}

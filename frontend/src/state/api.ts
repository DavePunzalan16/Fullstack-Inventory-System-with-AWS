/**
 * RTK Query API definition (Req 15.1–15.4, 15.6, 11.6, 24.4, Property 21).
 *
 * This is the SINGLE place in the frontend permitted to perform HTTP calls
 * (the ESLint config forbids fetch/axios elsewhere). All endpoints are defined
 * here with tag types; mutations invalidate the tags of affected resources so
 * queries refetch without a full reload.
 *
 * The base URL comes from NEXT_PUBLIC_API_BASE_URL (Req 15.2). prepareHeaders
 * injects `Authorization: Bearer <token>` from stored auth (Req 11.6).
 */

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

import { getToken } from '@/lib/auth';
import type {
  DashboardSummary,
  Expense,
  ExpenseInput,
  ExpenseListQuery,
  PopularProduct,
  Product,
  ProductInput,
  ProductListQuery,
  ProductListResponse,
  SessionUser,
  TrendBucket,
} from '@/types';

/** Base URL from the build-time env var (Req 15.2). */
const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

/** Tag types used for cache invalidation (Req 15.3). */
export const TAG_TYPES = ['Product', 'Expense', 'User', 'Dashboard', 'StockMovement'] as const;

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl,
    prepareHeaders: (headers) => {
      // Property 21: attach the stored token to every request.
      const token = getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: TAG_TYPES,
  endpoints: (builder) => ({
    // ---- Dashboard ----
    getDashboardSummary: builder.query<DashboardSummary, void>({
      query: () => '/dashboard/summary',
      providesTags: ['Dashboard'],
    }),
    getTrends: builder.query<TrendBucket[], void>({
      query: () => '/dashboard/trends',
      providesTags: ['Dashboard'],
    }),
    getExpenseBreakdown: builder.query<Record<string, number>, void>({
      query: () => '/dashboard/expense-breakdown',
      providesTags: ['Dashboard'],
    }),
    getPopularProducts: builder.query<PopularProduct[], void>({
      query: () => '/dashboard/popular-products',
      providesTags: ['Dashboard'],
    }),

    // ---- Products ----
    getProducts: builder.query<ProductListResponse, ProductListQuery | void>({
      query: (params) => ({ url: '/products', params: params ?? {} }),
      providesTags: ['Product'],
    }),
    getProduct: builder.query<Product, string>({
      query: (id) => `/products/${id}`,
      providesTags: ['Product'],
    }),
    searchProducts: builder.query<Product[], string>({
      query: (q) => ({ url: '/products/search', params: { q } }),
      providesTags: ['Product'],
    }),
    createProduct: builder.mutation<Product, ProductInput>({
      query: (body) => ({ url: '/products', method: 'POST', body }),
      invalidatesTags: ['Product', 'Dashboard'],
    }),
    updateProduct: builder.mutation<Product, { id: string; body: Partial<ProductInput> }>({
      query: ({ id, body }) => ({ url: `/products/${id}`, method: 'PUT', body }),
      invalidatesTags: ['Product', 'Dashboard'],
    }),
    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({ url: `/products/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Product', 'Dashboard'],
    }),

    // ---- Expenses ----
    getExpenses: builder.query<Expense[], ExpenseListQuery | void>({
      query: (params) => ({ url: '/expenses', params: params ?? {} }),
      providesTags: ['Expense'],
    }),
    getExpensesByCategory: builder.query<Record<string, number>, void>({
      query: () => '/expenses/by-category',
      providesTags: ['Expense'],
    }),
    createExpense: builder.mutation<Expense, ExpenseInput>({
      query: (body) => ({ url: '/expenses', method: 'POST', body }),
      invalidatesTags: ['Expense', 'Dashboard'],
    }),
    deleteExpense: builder.mutation<void, string>({
      query: (id) => ({ url: `/expenses/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Expense', 'Dashboard'],
    }),

    // ---- Users ----
    getUsers: builder.query<SessionUser[], void>({
      query: () => '/users',
      providesTags: ['User'],
    }),
    getMe: builder.query<SessionUser, void>({
      query: () => '/users/me',
      providesTags: ['User'],
    }),
  }),
});

export const {
  useGetDashboardSummaryQuery,
  useGetTrendsQuery,
  useGetExpenseBreakdownQuery,
  useGetPopularProductsQuery,
  useGetProductsQuery,
  useGetProductQuery,
  useSearchProductsQuery,
  useLazySearchProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetExpensesQuery,
  useGetExpensesByCategoryQuery,
  useCreateExpenseMutation,
  useDeleteExpenseMutation,
  useGetUsersQuery,
  useGetMeQuery,
} = api;

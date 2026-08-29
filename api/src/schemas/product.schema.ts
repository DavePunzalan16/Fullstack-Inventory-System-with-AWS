/**
 * Product validation schemas (Req 4.1, 4.7, 3.2, 3.3, 3.5, 8.5).
 *
 * Zod schemas double as the source of TypeScript types (design decision:
 * Zod over Joi for first-class inference). Ranges mirror Requirement 4.1.
 */

import { z } from 'zod';

/** Field bounds from Req 4.1 (single source of truth for API + tests). */
export const PRODUCT_BOUNDS = {
  nameMin: 1,
  nameMax: 255,
  skuMin: 1,
  skuMax: 50,
  priceMin: 0.01,
  priceMax: 999999.99,
  stockMin: 0,
  stockMax: 999999,
  thresholdMin: 0,
  thresholdMax: 999999,
  ratingMin: 0,
  ratingMax: 5,
} as const;

/** Body schema for creating a product. */
export const createProductSchema = z.object({
  name: z.string().min(PRODUCT_BOUNDS.nameMin).max(PRODUCT_BOUNDS.nameMax),
  sku: z.string().min(PRODUCT_BOUNDS.skuMin).max(PRODUCT_BOUNDS.skuMax),
  price: z.coerce
    .number()
    .min(PRODUCT_BOUNDS.priceMin, { message: 'must be between 0.01 and 999999.99' })
    .max(PRODUCT_BOUNDS.priceMax, { message: 'must be between 0.01 and 999999.99' }),
  stockQuantity: z.coerce
    .number()
    .int()
    .min(PRODUCT_BOUNDS.stockMin)
    .max(PRODUCT_BOUNDS.stockMax),
  reorderThreshold: z.coerce
    .number()
    .int()
    .min(PRODUCT_BOUNDS.thresholdMin)
    .max(PRODUCT_BOUNDS.thresholdMax),
  rating: z.coerce
    .number()
    .min(PRODUCT_BOUNDS.ratingMin)
    .max(PRODUCT_BOUNDS.ratingMax),
  categoryId: z.string().min(1),
});

/** Body schema for updating a product (all fields optional). */
export const updateProductSchema = createProductSchema.partial();

/** Valid page sizes (Req 3.5). */
export const PAGE_SIZES = [10, 25, 50, 100] as const;
export const DEFAULT_PAGE_SIZE = 25;

/** Query schema for the product list (pagination/sort/filter). */
export const listProductsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .refine((v) => (PAGE_SIZES as readonly number[]).includes(v), {
      message: 'pageSize must be one of 10, 25, 50, 100',
    })
    .default(DEFAULT_PAGE_SIZE),
  sortBy: z
    .enum(['name', 'sku', 'price', 'stockQuantity', 'rating', 'createdAt'])
    .default('createdAt'),
  sortDir: z.enum(['asc', 'desc']).default('asc'),
  name: z.string().max(255).optional(),
  sku: z.string().max(50).optional(),
  categoryId: z.string().optional(),
});

/** Query schema for search (min 2 chars, Req 8.5). */
export const searchQuerySchema = z.object({
  q: z.string().min(2, { message: 'query must be at least 2 characters' }).max(255),
});

/** Path-param schema for endpoints with a product id. */
export const productIdParamSchema = z.object({ id: z.string().min(1) });

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type ListProductsQuery = z.infer<typeof listProductsQuerySchema>;

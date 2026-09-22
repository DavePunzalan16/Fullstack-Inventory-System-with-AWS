/**
 * Product service: business logic + Prisma data access (Req 4.1–4.8, 3.x, 8.5).
 *
 * Pure helpers (low-stock predicate, sorting, pagination, filtering, search
 * matching) are exported separately so property tests can exercise the logic
 * directly without a database. Prisma-backed methods compose these with
 * persistence.
 */

import { Prisma } from '@prisma/client';

import { prisma } from '../lib/prisma';
import { ConflictError, NotFoundError } from '../lib/errors';
import type {
  CreateProductInput,
  ListProductsQuery,
  UpdateProductInput,
} from '../schemas/product.schema';

/** A product shape used by the pure helpers (subset of the model). */
export interface ProductLike {
  readonly stockQuantity: number;
  readonly reorderThreshold: number;
}

/** Low-stock predicate (Glossary Low_Stock, Req 1.3/3.6). */
export function isLowStock(product: ProductLike): boolean {
  return product.stockQuantity <= product.reorderThreshold;
}

/** Case-insensitive partial match on name or SKU (Req 8.5). */
export function matchesSearch(
  product: { name: string; sku: string },
  query: string,
): boolean {
  const q = query.toLowerCase();
  return (
    product.name.toLowerCase().includes(q) ||
    product.sku.toLowerCase().includes(q)
  );
}

/**
 * Pure pagination: returns the slice for a 1-based page and page size.
 * Invariant (Property 10): pages are disjoint and concatenate to the whole
 * ordered list.
 */
export function paginate<T>(items: readonly T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

/** Maps a Prisma product row to the API response shape (adds isLowStock). */
function toApiProduct<T extends ProductLike>(row: T): T & { isLowStock: boolean } {
  return { ...row, isLowStock: isLowStock(row) };
}

/** Detects a Prisma unique-constraint violation (P2002). */
function isUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002'
  );
}

/** Creates a product; 409 on duplicate SKU (Req 4.6). */
export async function createProduct(input: CreateProductInput) {
  try {
    const created = await prisma.product.create({
      data: {
        name: input.name,
        sku: input.sku,
        price: new Prisma.Decimal(input.price),
        stockQuantity: input.stockQuantity,
        reorderThreshold: input.reorderThreshold,
        rating: new Prisma.Decimal(input.rating),
        categoryId: input.categoryId,
      },
    });
    return toApiProduct(created);
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new ConflictError('SKU already in use');
    }
    throw err;
  }
}

/** Updates a product; 404 if missing, 409 on SKU conflict (Req 4.2, 4.6, 4.8). */
export async function updateProduct(id: string, input: UpdateProductInput) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (existing === null) {
    throw new NotFoundError('Product not found');
  }
  try {
    const data: Prisma.ProductUpdateInput = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.sku !== undefined) data.sku = input.sku;
    if (input.price !== undefined) data.price = new Prisma.Decimal(input.price);
    if (input.stockQuantity !== undefined) data.stockQuantity = input.stockQuantity;
    if (input.reorderThreshold !== undefined)
      data.reorderThreshold = input.reorderThreshold;
    if (input.rating !== undefined) data.rating = new Prisma.Decimal(input.rating);
    if (input.categoryId !== undefined)
      data.category = { connect: { id: input.categoryId } };

    const updated = await prisma.product.update({ where: { id }, data });
    return toApiProduct(updated);
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new ConflictError('SKU already in use');
    }
    throw err;
  }
}

/** Deletes a product; 404 if missing (Req 4.3, 4.8). */
export async function deleteProduct(id: string): Promise<void> {
  try {
    await prisma.product.delete({ where: { id } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2025'
    ) {
      throw new NotFoundError('Product not found');
    }
    throw err;
  }
}

/** Fetches a product by id; 404 if missing (Req 4.8). */
export async function getProduct(id: string) {
  const row = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });
  if (row === null) {
    throw new NotFoundError('Product not found');
  }
  return toApiProduct(row);
}

/** Paginated/sorted/filtered product list (Req 3.2, 3.3, 3.5). */
export async function listProducts(query: ListProductsQuery) {
  const where: Prisma.ProductWhereInput = {};
  if (query.name) where.name = { contains: query.name, mode: 'insensitive' };
  if (query.sku) where.sku = { contains: query.sku, mode: 'insensitive' };
  if (query.categoryId) where.categoryId = query.categoryId;

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { [query.sortBy]: query.sortDir },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { category: true },
    }),
  ]);

  return {
    data: rows.map(toApiProduct),
    page: query.page,
    pageSize: query.pageSize,
    total,
  };
}

/** Search: up to 10 case-insensitive partial matches on name/SKU (Req 8.5). */
export async function searchProducts(q: string) {
  const rows = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q, mode: 'insensitive' } },
      ],
    },
    take: 10,
  });
  return rows.map(toApiProduct);
}

/** Sets a product's image URL (used by the image upload flow, Req 5.1). */
export async function setProductImageUrl(id: string, imageUrl: string) {
  const updated = await prisma.product.update({
    where: { id },
    data: { imageUrl },
  });
  return toApiProduct(updated);
}

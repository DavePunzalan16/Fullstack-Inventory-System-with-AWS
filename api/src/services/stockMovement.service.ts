/**
 * Stock movement service (Req 26.1, 26.2, 26.4, 26.6, Properties 31, 32).
 *
 * A movement records the product, type, signed quantity, UTC timestamp, and
 * initiating user, and adjusts the product's stockQuantity by exactly that
 * signed delta (Property 31). History is returned newest-first, paginated
 * (Property 32). The signed-delta rule is a pure exported function.
 */

import type { MovementType } from '@prisma/client';

import { NotFoundError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import type {
  CreateStockMovementInput,
  ListMovementsQuery,
} from '../schemas/stockMovement.schema';

/**
 * Computes the signed stock delta for a movement (Property 31).
 * `sale` decreases stock; `restock` increases; `adjustment` applies the
 * provided quantity as-is (may be negative). The validated input quantity is a
 * non-zero integer; for `sale`/`restock` it is treated as a positive magnitude.
 */
export function signedDelta(type: MovementType, quantity: number): number {
  switch (type) {
    case 'sale':
      return -Math.abs(quantity);
    case 'restock':
      return Math.abs(quantity);
    case 'adjustment':
    default:
      return quantity;
  }
}

/** Creates a movement and adjusts stock atomically (Req 26.1, 26.4). */
export async function createMovement(
  productId: string,
  input: CreateStockMovementInput,
  userId: string,
) {
  const delta = signedDelta(input.type, input.quantity);

  return prisma.$transaction(async (tx) => {
    const product = await tx.product.findUnique({ where: { id: productId } });
    if (product === null) {
      throw new NotFoundError('Product not found');
    }

    const movement = await tx.stockMovement.create({
      data: {
        productId,
        type: input.type,
        quantity: delta,
        createdByUserId: userId,
      },
    });

    await tx.product.update({
      where: { id: productId },
      data: { stockQuantity: { increment: delta } },
    });

    return movement;
  });
}

/** Returns paginated movement history, newest-first (Req 26.2, 26.6). */
export async function listMovements(productId: string, query: ListMovementsQuery) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true },
  });
  if (product === null) {
    throw new NotFoundError('Product not found');
  }

  const [total, data] = await Promise.all([
    prisma.stockMovement.count({ where: { productId } }),
    prisma.stockMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  return { data, page: query.page, pageSize: query.pageSize, total };
}

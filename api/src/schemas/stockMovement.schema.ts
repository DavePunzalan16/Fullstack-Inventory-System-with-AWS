/**
 * Stock movement validation schemas (Req 26.1, 26.5).
 */

import { z } from 'zod';

/** Movement types (mirrors Prisma MovementType). */
export const MOVEMENT_TYPES = ['restock', 'sale', 'adjustment'] as const;

/** Body schema for creating a stock movement. Quantity must be a non-zero int. */
export const createStockMovementSchema = z.object({
  type: z.enum(MOVEMENT_TYPES),
  quantity: z.coerce
    .number()
    .int({ message: 'quantity must be an integer' })
    .refine((v) => v !== 0, { message: 'quantity must not be zero' }),
});

/** Query schema for movement history (pagination). */
export const listMovementsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export const productIdParamSchema = z.object({ id: z.string().min(1) });

export type CreateStockMovementInput = z.infer<typeof createStockMovementSchema>;
export type ListMovementsQuery = z.infer<typeof listMovementsQuerySchema>;

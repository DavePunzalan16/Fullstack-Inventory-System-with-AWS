/**
 * Stock movement controllers (Req 26.x).
 */

import type { NextFunction, Request, Response } from 'express';

import { UnauthorizedError } from '../lib/errors';
import { prisma } from '../lib/prisma';
import * as service from '../services/stockMovement.service';
import type {
  CreateStockMovementInput,
  ListMovementsQuery,
} from '../schemas/stockMovement.schema';

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}

/** Resolves the initiating user's DB id from the authenticated cognitoSub. */
async function resolveUserId(cognitoSub: string): Promise<string> {
  const user = await prisma.user.findUnique({
    where: { cognitoSub },
    select: { id: true },
  });
  if (user === null) {
    throw new UnauthorizedError('Authenticated user not found');
  }
  return user.id;
}

export const create = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const cognitoSub = req.user?.cognitoSub;
  if (cognitoSub === undefined) {
    throw new UnauthorizedError('Unauthorized');
  }
  const userId = await resolveUserId(cognitoSub);
  const movement = await service.createMovement(
    id,
    req.body as CreateStockMovementInput,
    userId,
  );
  res.status(201).json(movement);
});

export const list = asyncHandler(async (req, res) => {
  const { id } = req.params as { id: string };
  const result = await service.listMovements(
    id,
    req.query as unknown as ListMovementsQuery,
  );
  res.status(200).json(result);
});

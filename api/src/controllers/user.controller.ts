/**
 * User controllers (Req 6.1, 6.4).
 */

import type { NextFunction, Request, Response } from 'express';

import { NotFoundError, UnauthorizedError } from '../lib/errors';
import * as service from '../services/user.service';

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}

export const list = asyncHandler(async (_req, res) => {
  const users = await service.listUsers();
  res.status(200).json(users);
});

export const me = asyncHandler(async (req, res) => {
  const cognitoSub = req.user?.cognitoSub;
  if (cognitoSub === undefined) {
    throw new UnauthorizedError('Unauthorized');
  }
  const user = await service.getByCognitoSub(cognitoSub);
  if (user === null) {
    throw new NotFoundError('User not found');
  }
  res.status(200).json(user);
});

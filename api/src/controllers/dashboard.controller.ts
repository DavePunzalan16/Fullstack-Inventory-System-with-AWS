/**
 * Dashboard controllers (Req 1.x, 2.x).
 */

import type { NextFunction, Request, Response } from 'express';

import * as service from '../services/dashboard.service';

function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}

export const summary = asyncHandler(async (_req, res) => {
  res.status(200).json(await service.getSummary());
});

export const trends = asyncHandler(async (_req, res) => {
  res.status(200).json(await service.getTrends());
});

export const expenseBreakdown = asyncHandler(async (_req, res) => {
  res.status(200).json(await service.getExpenseBreakdown());
});

export const popularProducts = asyncHandler(async (_req, res) => {
  res.status(200).json(await service.getPopularProducts());
});

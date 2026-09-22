/**
 * Email/password auth routes (Batch 3). Public: POST /auth/login and
 * /auth/signup. Mounted before the authentication middleware so unauthenticated
 * users can sign in / register. Available in every mode (local email/password),
 * alongside Cognito for production JWTs.
 */

import { Router, type Request, type Response, type NextFunction } from 'express';

import * as authService from '../lib/auth.service';

function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
}

export function authRouter(): Router {
  const router = Router();

  router.post('/auth/signup', asyncHandler(async (req, res) => {
    const { email, password, name } = (req.body ?? {}) as { email?: string; password?: string; name?: string };
    const result = await authService.signup(String(email ?? ''), String(password ?? ''), name);
    res.status(201).json(result);
  }));

  router.post('/auth/login', asyncHandler(async (req, res) => {
    const { email, password } = (req.body ?? {}) as { email?: string; password?: string };
    const result = await authService.login(String(email ?? ''), String(password ?? ''));
    res.status(200).json(result);
  }));

  return router;
}
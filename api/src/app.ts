/**
 * Express application assembly.
 *
 * {@link createApp} builds the Express app with the full middleware chain in
 * the order required by the design:
 *   security (helmet + nosniff + CORS + body limit) Ã¢â€ â€™ request logging Ã¢â€ â€™
 *   rate limiting Ã¢â€ â€™ routing (public /health, then authenticated feature
 *   routes) Ã¢â€ â€™ centralized error handler.
 *
 * Authentication and per-route authorization are applied inside the feature
 * routers (they receive the shared auth middleware). Keeping assembly here
 * separate from bootstrap (`index.ts`) lets integration tests exercise the app
 * with Supertest without opening a network listener.
 */

import express, { type Express, type RequestHandler } from 'express';

import type { AppConfig } from './config/env';
import { cognitoConfigFromEnv, createCognitoVerifier } from './lib/cognito';
import { createDevVerifier } from './lib/devAuth';
import { prisma } from './lib/prisma';
import { createAuthMiddleware, type RoleLookup, type TokenVerifier } from './middleware/auth';
import { errorHandler } from './middleware/error';
import { buildRateLimiter } from './middleware/rateLimit';
import { createRequestLogger } from './middleware/requestLogger';
import { securityMiddleware } from './middleware/security';
import { registerRoutes } from './routes';
import { authRouter } from './routes/auth.routes';
import { devAuthRouter } from './routes/devAuth.routes';
import type { Role } from './types';

import './types'; // load Express type augmentation

/** Overridable dependencies, primarily for testing. */
export interface CreateAppDeps {
  /** JWT verifier; defaults to the Cognito JWKS verifier from env config. */
  readonly verifyToken?: TokenVerifier;
  /** DB role lookup; defaults to a Prisma-backed lookup by cognitoSub. */
  readonly lookupRole?: RoleLookup;
  /** Extra middleware to run before routes (e.g. rate limiter override). */
  readonly preRouteMiddleware?: RequestHandler[];
}

/** Prisma-backed role lookup used in production (Req 12.1 fallback path). */
export function prismaRoleLookup(): RoleLookup {
  return async (cognitoSub: string): Promise<Role | undefined> => {
    const user = await prisma.user.findUnique({
      where: { cognitoSub },
      select: { role: true },
    });
    return user?.role as Role | undefined;
  };
}

/**
 * Assembles the Express application.
 *
 * @param config - The validated application configuration.
 * @param deps - Optional dependency overrides for testing.
 */
export function createApp(config: AppConfig, deps: CreateAppDeps = {}): Express {
  const app = express();
  app.set('config', config);
  app.set('trust proxy', 1); // correct client IP behind API Gateway (rate limit)

  // 1. Security + body parsing (helmet, nosniff, CORS, 1MB limit).
  for (const mw of securityMiddleware(config)) {
    app.use(mw);
  }

  // 2. Request logging (method, path, status, response time).
  app.use(createRequestLogger());

  // 3. Rate limiting (skips /health internally).
  app.use(...(deps.preRouteMiddleware ?? [buildRateLimiter()]));

  // Shared authentication middleware for protected routers.
  const verifyToken =
    deps.verifyToken ??
    (config.authMode === 'dev'
      ? createDevVerifier()
      : createCognitoVerifier(cognitoConfigFromEnv()));
  const lookupRole = deps.lookupRole ?? prismaRoleLookup();
  const authenticate = createAuthMiddleware({ verifyToken, lookupRole });

  // 4. Routes: public /health + public email/password auth, then authenticated routes.
  // Email/password login/signup are public (mounted before authentication).
  app.use(authRouter());
  if (config.authMode === 'dev') {
    // Local-only public sign-in endpoint (no Cognito). Never mounted in production.
    app.use(devAuthRouter());
  }
  registerRoutes(app, { authenticate });

  // 5. Centralized error handler (last).
  app.use(errorHandler);

  return app;
}

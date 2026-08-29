/**
 * Express application assembly.
 *
 * {@link createApp} builds the Express app with the full middleware chain in
 * the order required by the design:
 *   security (helmet + nosniff + CORS + body limit) → request logging →
 *   rate limiting → routing (public /health, then authenticated feature
 *   routes) → centralized error handler.
 *
 * Authentication and per-route authorization are applied inside the feature
 * routers (they receive the shared auth middleware). Keeping assembly here
 * separate from bootstrap (`index.ts`) lets integration tests exercise the app
 * with Supertest without opening a network listener.
 */

import express, { type Express, type RequestHandler } from 'express';

import type { AppConfig } from './config/env';
import { cognitoConfigFromEnv, createCognitoVerifier } from './lib/cognito';
import { prisma } from './lib/prisma';
import { createAuthMiddleware, type RoleLookup, type TokenVerifier } from './middleware/auth';
import { errorHandler } from './middleware/error';
import { buildRateLimiter } from './middleware/rateLimit';
import { createRequestLogger } from './middleware/requestLogger';
import { securityMiddleware } from './middleware/security';
import { registerRoutes } from './routes';
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
    deps.verifyToken ?? createCognitoVerifier(cognitoConfigFromEnv());
  const lookupRole = deps.lookupRole ?? prismaRoleLookup();
  const authenticate = createAuthMiddleware({ verifyToken, lookupRole });

  // 4. Routes: public /health first, then authenticated feature routes.
  registerRoutes(app, { authenticate });

  // 5. Centralized error handler (last).
  app.use(errorHandler);

  return app;
}

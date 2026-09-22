/**
 * Route registry.
 *
 * Mounts the public health route first, then the authenticated feature routers.
 * Every feature router is preceded by the shared authentication middleware so
 * all feature endpoints require a valid Cognito JWT (Req 11.10). Per-endpoint
 * authorization (RBAC) is applied within each router.
 */

import type { Express, RequestHandler } from 'express';

import { dashboardRouter } from './dashboard.routes';
import { expenseRouter } from './expense.routes';
import { healthRouter } from './health.routes';
import { productRouter } from './product.routes';
import { stockMovementRouter } from './stockMovement.routes';
import { userRouter } from './user.routes';

/** Dependencies shared by feature routers. */
export interface RouteDeps {
  /** Authentication middleware applied to all feature routes. */
  readonly authenticate: RequestHandler;
}

/** Registers all routes onto the app. */
export function registerRoutes(app: Express, deps: RouteDeps): void {
  // Public: no auth, no rate limit (rate limiter skips /health).
  app.use(healthRouter());

  // Authenticated feature routes.
  app.use(deps.authenticate);
  app.use(productRouter());
  app.use(stockMovementRouter());
  app.use(expenseRouter());
  app.use(userRouter());
  app.use(dashboardRouter());
}

/**
 * Dev-login route (AUTH_MODE=dev only). Mounted before authentication so it is
 * publicly reachable for local sign-in without Cognito.
 *
 * POST /auth/dev-login  { email?: string, role?: "admin" | "staff" }
 *   - If email is given, logs in that seeded user.
 *   - Else if role is given, logs in the first seeded user with that role.
 *   - Else logs in the first admin.
 * Returns { token, user } where token is a dev token for the API.
 */

import { Router, type Request, type Response } from 'express';

import { makeDevToken } from '../lib/devAuth';
import { prisma } from '../lib/prisma';

export function devAuthRouter(): Router {
  const router = Router();

  router.post('/auth/dev-login', async (req: Request, res: Response) => {
    const body = (req.body ?? {}) as { email?: string; role?: string };
    const wantRole = body.role === 'staff' ? 'staff' : body.role === 'admin' ? 'admin' : undefined;

    const user = body.email
      ? await prisma.user.findFirst({ where: { email: body.email } })
      : await prisma.user.findFirst({
          where: wantRole ? { role: wantRole } : { role: 'admin' },
          orderBy: { name: 'asc' },
        });

    if (user === null) {
      res.status(404).json({ error: 'No matching seeded user found' });
      return;
    }

    res.status(200).json({
      token: makeDevToken(user.cognitoSub),
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  });

  // Convenience: list seeded users so the dev UI can offer a picker.
  router.get('/auth/dev-users', async (_req: Request, res: Response) => {
    const users = await prisma.user.findMany({
      select: { name: true, email: true, role: true },
      orderBy: { role: 'asc' },
    });
    res.status(200).json(users);
  });

  return router;
}

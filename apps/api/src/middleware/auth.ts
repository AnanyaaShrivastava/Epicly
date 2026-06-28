import { Request, Response, NextFunction } from 'express';
import { getSupabaseAdmin } from '../db/client';

export interface AuthPayload {
  sub: string;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthPayload;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid authorization header', code: 'UNAUTHORIZED' });
    return;
  }

  const token = authHeader.slice(7);

  // Use Supabase admin client to verify the token — handles ES256 (asymmetric) automatically
  getSupabaseAdmin()
    .auth.getUser(token)
    .then(({ data, error }) => {
      if (error || !data.user) {
        res.status(401).json({ error: 'Invalid or expired token', code: 'INVALID_TOKEN' });
        return;
      }

      req.user = {
        sub: data.user.id,
        email: data.user.email ?? '',
      };
      next();
    })
    .catch(() => {
      res.status(401).json({ error: 'Token verification failed', code: 'INVALID_TOKEN' });
    });
}

export function optionalAuthMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  authMiddleware(req, res, next);
}

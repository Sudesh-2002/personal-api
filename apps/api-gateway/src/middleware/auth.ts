import { Response, NextFunction } from 'express';
import { jwtVerify } from 'jose';
import { config } from '@/config';
import { AppError } from '@/middleware/errorHandler';
import { AuthenticatedRequest } from '@/types';
import { logger } from '@/utils/logger';

const JWT_SECRET = new TextEncoder().encode(config.JWT_SECRET);

export async function authMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Try Bearer JWT
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const { payload } = await jwtVerify(token, JWT_SECRET);

      req.user = {
        sub: payload.sub as string,
        email: payload.email as string | undefined,
        scope: (payload.scope as string ?? '').split(' ').filter(Boolean),
      };

      return next();
    }

    // 2. Try API Key header
    const apiKey = req.headers[config.API_KEY_HEADER] as string;
    if (apiKey) {
      // In production this would validate against auth-service
      // For now we do a basic non-empty check and attach a system user
      if (apiKey.length < 32) {
        throw new AppError(401, 'Unauthorized', 'Invalid API key format.');
      }

      req.user = {
        sub: `apikey:${apiKey.slice(0, 8)}`,
        scope: ['read', 'write'],
      };

      logger.debug({ sub: req.user.sub }, 'API key authenticated');
      return next();
    }

    throw new AppError(
      401,
      'Unauthorized',
      'No credentials provided. Use a Bearer token or API key.',
      'https://personal-api.local/errors/unauthorized'
    );
  } catch (err) {
    if (err instanceof AppError) return next(err);

    return next(
      new AppError(
        401,
        'Unauthorized',
        'Token validation failed. Please re-authenticate.',
        'https://personal-api.local/errors/token-invalid'
      )
    );
  }
}
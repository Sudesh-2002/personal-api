import { Request, Response, NextFunction } from 'express';
import { apiKeyRepository } from '@/modules/apikeys/apikey.repository';
import { tokenRepository } from './token.repository';
import { signAccessToken } from '@/utils/jwt';
import { generateRefreshToken, hashKey } from '@/utils/crypto';
import { exchangeTokenSchema, refreshTokenSchema } from '@/modules/apikeys/apikey.schema';
import { config } from '@/config';
import { logger } from '@/utils/logger';
import { ProblemDetail, TokenPair } from '@/types';

function problem(res: Response, status: number, title: string, detail: string, instance: string): void {
  const body: ProblemDetail = { type: 'about:blank', title, status, detail, instance };
  res.status(status).json(body);
}

export const tokenController = {
  // POST /auth/token — exchange API key for JWT pair
  async exchange(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = exchangeTokenSchema.safeParse(req.body);
      if (!parsed.success) {
        problem(res, 422, 'Unprocessable Entity', JSON.stringify(parsed.error.flatten().fieldErrors), req.path);
        return;
      }

      const { apiKey: rawKey } = parsed.data;
      const keyHash = hashKey(rawKey);
      const keyRow = apiKeyRepository.findByHash(keyHash);

      if (!keyRow) {
        problem(res, 401, 'Unauthorized', 'Invalid or revoked API key.', req.path);
        return;
      }

      // Check expiry
      if (keyRow.expires_at && new Date(keyRow.expires_at) < new Date()) {
        problem(res, 401, 'Unauthorized', 'API key has expired.', req.path);
        return;
      }

      const scope = keyRow.scope.split(' ').filter(Boolean);

      // Issue access token + refresh token
      const [accessToken, rawRefreshToken] = await Promise.all([
        signAccessToken(keyRow.user_id, keyRow.id, scope),
        Promise.resolve(generateRefreshToken()),
      ]);

      tokenRepository.create(
        keyRow.user_id,
        keyRow.id,
        rawRefreshToken,
        config.JWT_REFRESH_TOKEN_TTL
      );

      apiKeyRepository.updateLastUsed(keyRow.id);

      const tokenPair: TokenPair = {
        accessToken,
        refreshToken: rawRefreshToken,
        tokenType: 'Bearer',
        expiresIn: config.JWT_ACCESS_TOKEN_TTL,
        scope,
      };

      logger.info({ userId: keyRow.user_id, keyId: keyRow.id }, 'Token issued');
      res.json({ data: tokenPair });
    } catch (err) { next(err); }
  },

  // POST /auth/token/refresh — refresh access token
  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = refreshTokenSchema.safeParse(req.body);
      if (!parsed.success) {
        problem(res, 422, 'Unprocessable Entity', JSON.stringify(parsed.error.flatten().fieldErrors), req.path);
        return;
      }

      const { refreshToken: rawToken } = parsed.data;
      const tokenRow = tokenRepository.findByToken(rawToken);

      if (!tokenRow) {
        problem(res, 401, 'Unauthorized', 'Invalid or expired refresh token.', req.path);
        return;
      }

      const keyRow = apiKeyRepository.findByHash(''); // get by id instead
      // Fetch key directly by id
      const db = (await import('@/db/connection')).getDb();
      const stmt = db.prepare('SELECT * FROM api_keys WHERE id = ? AND is_active = 1');
      stmt.bind([tokenRow.api_key_id]);
      const keyRows: Record<string, unknown>[] = [];
      while (stmt.step()) keyRows.push(stmt.getAsObject());
      stmt.free();

      if (keyRows.length === 0) {
        problem(res, 401, 'Unauthorized', 'Associated API key is no longer active.', req.path);
        return;
      }

      const key = keyRows[0] as { user_id: string; id: string; scope: string };
      const scope = key.scope.split(' ').filter(Boolean);

      // Rotate: revoke old, issue new pair
      tokenRepository.revoke(rawToken);

      const [newAccessToken, newRawRefreshToken] = await Promise.all([
        signAccessToken(key.user_id, key.id, scope),
        Promise.resolve(generateRefreshToken()),
      ]);

      tokenRepository.create(
        key.user_id,
        key.id,
        newRawRefreshToken,
        config.JWT_REFRESH_TOKEN_TTL
      );

      const tokenPair: TokenPair = {
        accessToken: newAccessToken,
        refreshToken: newRawRefreshToken,
        tokenType: 'Bearer',
        expiresIn: config.JWT_ACCESS_TOKEN_TTL,
        scope,
      };

      logger.info({ userId: key.user_id, keyId: key.id }, 'Token refreshed');
      res.json({ data: tokenPair });
    } catch (err) { next(err); }
  },

  // POST /auth/token/revoke — revoke a refresh token
  revoke(req: Request, res: Response, next: NextFunction): void {
    try {
      const parsed = refreshTokenSchema.safeParse(req.body);
      if (!parsed.success) {
        problem(res, 422, 'Unprocessable Entity', JSON.stringify(parsed.error.flatten().fieldErrors), req.path);
        return;
      }
      tokenRepository.revoke(parsed.data.refreshToken);
      res.json({ message: 'Token revoked successfully.' });
    } catch (err) { next(err); }
  },

  // POST /auth/token/verify — verify an access token
  async verify(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.body as { token?: string };
      if (!token) {
        problem(res, 422, 'Unprocessable Entity', 'token is required.', req.path);
        return;
      }
      const { verifyAccessToken } = await import('@/utils/jwt');
      const payload = await verifyAccessToken(token);
      res.json({ data: { valid: true, payload } });
    } catch {
      res.json({ data: { valid: false, reason: 'Token is invalid or expired.' } });
    }
  },
};
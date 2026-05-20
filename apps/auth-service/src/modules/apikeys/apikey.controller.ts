import { Request, Response, NextFunction } from 'express';
import { apiKeyRepository } from './apikey.repository';
import { createApiKeySchema } from './apikey.schema';
import { ProblemDetail } from '@/types';

function problem(res: Response, status: number, title: string, detail: string, instance: string): void {
  const body: ProblemDetail = { type: 'about:blank', title, status, detail, instance };
  res.status(status).json(body);
}

export const apiKeyController = {
  // GET /auth/keys
  getAll(req: Request, res: Response, next: NextFunction): void {
    try {
      const keys = apiKeyRepository.findAll(req.userId);
      res.json({ data: keys, count: keys.length });
    } catch (err) { next(err); }
  },

  // GET /auth/keys/:id
  getOne(req: Request, res: Response, next: NextFunction): void {
    try {
      const key = apiKeyRepository.findById(req.userId, req.params.id);
      if (!key) {
        problem(res, 404, 'Not Found', `API key '${req.params.id}' not found.`, req.path);
        return;
      }
      res.json({ data: key });
    } catch (err) { next(err); }
  },

  // POST /auth/keys
  create(req: Request, res: Response, next: NextFunction): void {
    try {
      const parsed = createApiKeySchema.safeParse(req.body);
      if (!parsed.success) {
        problem(res, 422, 'Unprocessable Entity', JSON.stringify(parsed.error.flatten().fieldErrors), req.path);
        return;
      }
      const { apiKey, rawKey } = apiKeyRepository.create(req.userId, {
        name: parsed.data.name,
        scope: parsed.data.scope,
        expiresAt: parsed.data.expiresAt,
      });
      // Return the raw key ONCE — it is never stored and cannot be retrieved again
      res.status(201).json({
        data: { ...apiKey, key: rawKey },
        warning: 'Store this key securely. It will not be shown again.',
      });
    } catch (err) { next(err); }
  },

  // POST /auth/keys/:id/revoke
  revoke(req: Request, res: Response, next: NextFunction): void {
    try {
      const revoked = apiKeyRepository.revoke(req.userId, req.params.id);
      if (!revoked) {
        problem(res, 404, 'Not Found', `API key '${req.params.id}' not found.`, req.path);
        return;
      }
      res.json({ message: `API key '${req.params.id}' revoked successfully.` });
    } catch (err) { next(err); }
  },

  // DELETE /auth/keys/:id
  remove(req: Request, res: Response, next: NextFunction): void {
    try {
      const deleted = apiKeyRepository.delete(req.userId, req.params.id);
      if (!deleted) {
        problem(res, 404, 'Not Found', `API key '${req.params.id}' not found.`, req.path);
        return;
      }
      res.status(204).send();
    } catch (err) { next(err); }
  },
};
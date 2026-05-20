import { Request, Response, NextFunction } from 'express';
import { buildContext, invalidateContext } from './context.builder';
import { ProblemDetail } from '@/types';
import { logger } from '@/utils/logger';

function problem(res: Response, status: number, title: string, detail: string, instance: string): void {
  const body: ProblemDetail = { type: 'about:blank', title, status, detail, instance };
  res.status(status).json(body);
}

export const contextController = {
  // GET /context — full snapshot
  getSnapshot(req: Request, res: Response, next: NextFunction): void {
    const refresh = req.query.refresh === 'true';
    buildContext(req.userId, refresh)
      .then((snapshot) => {
        res.setHeader('Cache-Control', `private, max-age=${Math.floor(snapshot.ttlMs / 1000)}`);
        res.json({ data: snapshot });
      })
      .catch(next);
  },

  // GET /context/time
  getTime(req: Request, res: Response, next: NextFunction): void {
    buildContext(req.userId)
      .then((snapshot) => res.json({ data: snapshot.time }))
      .catch(next);
  },

  // GET /context/preferences
  getPreferences(req: Request, res: Response, next: NextFunction): void {
    buildContext(req.userId)
      .then((snapshot) => res.json({ data: snapshot.preferences }))
      .catch(next);
  },

  // GET /context/schedule
  getSchedule(req: Request, res: Response, next: NextFunction): void {
    buildContext(req.userId)
      .then((snapshot) => res.json({ data: snapshot.schedule }))
      .catch(next);
  },

  // GET /context/tags
  getTags(req: Request, res: Response, next: NextFunction): void {
    buildContext(req.userId)
      .then((snapshot) => res.json({ data: snapshot.tags, count: snapshot.tags.length }))
      .catch(next);
  },

  // POST /context/invalidate — force cache bust
  invalidate(req: Request, res: Response, next: NextFunction): void {
    try {
      invalidateContext(req.userId);
      logger.info({ userId: req.userId }, 'Context invalidated via API');
      res.status(200).json({ message: 'Context cache cleared. Next request will rebuild.' });
    } catch (err) {
      next(err);
    }
  },
};
import { Request, Response, NextFunction } from 'express';
import { preferenceRepository } from './preference.repository';
import {
  createPreferenceSchema,
  updatePreferenceSchema,
  upsertPreferenceSchema,
  querySchema,
} from './preference.schema';
import { ProblemDetail } from '@/types';

function problem(
  res: Response,
  status: number,
  title: string,
  detail: string,
  instance: string
): void {
  const body: ProblemDetail = { type: 'about:blank', title, status, detail, instance };
  res.status(status).json(body);
}

export const preferenceController = {
  getAll(req: Request, res: Response, next: NextFunction): void {
    try {
      const query = querySchema.safeParse(req.query);
      if (!query.success) {
        problem(res, 400, 'Bad Request', JSON.stringify(query.error.flatten().fieldErrors), req.path);
        return;
      }
      const preferences = preferenceRepository.findAll(req.userId, query.data.category);
      res.json({ data: preferences, count: preferences.length });
    } catch (err) {
      next(err);
    }
  },

  getOne(req: Request, res: Response, next: NextFunction): void {
    try {
      const pref = preferenceRepository.findById(req.userId, req.params.id);
      if (!pref) {
        problem(res, 404, 'Not Found', `Preference '${req.params.id}' not found.`, req.path);
        return;
      }
      res.json({ data: pref });
    } catch (err) {
      next(err);
    }
  },

  create(req: Request, res: Response, next: NextFunction): void {
    try {
      const parsed = createPreferenceSchema.safeParse(req.body);
      if (!parsed.success) {
        problem(res, 422, 'Unprocessable Entity', JSON.stringify(parsed.error.flatten().fieldErrors), req.path);
        return;
      }
      const existing = preferenceRepository.findByKey(
        req.userId,
        parsed.data.category,
        parsed.data.key
      );
      if (existing) {
        problem(res, 409, 'Conflict', `Preference '${parsed.data.category}/${parsed.data.key}' already exists.`, req.path);
        return;
      }
      const pref = preferenceRepository.create(req.userId, {
        category: parsed.data.category,
        key: parsed.data.key,
        value: parsed.data.value,
        description: parsed.data.description,
      });
      res.status(201).json({ data: pref });
    } catch (err) {
      next(err);
    }
  },

  update(req: Request, res: Response, next: NextFunction): void {
    try {
      const parsed = updatePreferenceSchema.safeParse(req.body);
      if (!parsed.success) {
        problem(res, 422, 'Unprocessable Entity', JSON.stringify(parsed.error.flatten().fieldErrors), req.path);
        return;
      }
      const pref = preferenceRepository.update(req.userId, req.params.id, {
        value: parsed.data.value,
        description: parsed.data.description,
      });
      if (!pref) {
        problem(res, 404, 'Not Found', `Preference '${req.params.id}' not found.`, req.path);
        return;
      }
      res.json({ data: pref });
    } catch (err) {
      next(err);
    }
  },

  upsert(req: Request, res: Response, next: NextFunction): void {
    try {
      const parsed = upsertPreferenceSchema.safeParse(req.body);
      if (!parsed.success) {
        problem(res, 422, 'Unprocessable Entity', JSON.stringify(parsed.error.flatten().fieldErrors), req.path);
        return;
      }
      const pref = preferenceRepository.upsert(req.userId, {
        category: parsed.data.category,
        key: parsed.data.key,
        value: parsed.data.value,
        description: parsed.data.description,
      });
      res.json({ data: pref });
    } catch (err) {
      next(err);
    }
  },

  remove(req: Request, res: Response, next: NextFunction): void {
    try {
      const deleted = preferenceRepository.delete(req.userId, req.params.id);
      if (!deleted) {
        problem(res, 404, 'Not Found', `Preference '${req.params.id}' not found.`, req.path);
        return;
      }
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
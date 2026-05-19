import { Request, Response, NextFunction } from 'express';
import { eventRepository } from './event.repository';
import { createEventSchema, updateEventSchema, querySchema } from './event.schema';
import { ProblemDetail } from '@/types';

function problem(res: Response, status: number, title: string, detail: string, instance: string): void {
  const body: ProblemDetail = { type: 'about:blank', title, status, detail, instance };
  res.status(status).json(body);
}

export const eventController = {
  // GET /events
  getAll(req: Request, res: Response, next: NextFunction): void {
    try {
      const q = querySchema.safeParse(req.query);
      if (!q.success) {
        problem(res, 400, 'Bad Request', JSON.stringify(q.error.flatten().fieldErrors), req.path);
        return;
      }
      const { from, to, status, category } = q.data;
      let events;
      if (from && to) {
        events = eventRepository.findInRange(req.userId, new Date(from), new Date(to));
      } else {
        events = eventRepository.findAll(req.userId, { status, category });
      }
      res.json({ data: events, count: events.length });
    } catch (err) { next(err); }
  },

  // GET /events/today
  getToday(req: Request, res: Response, next: NextFunction): void {
    try {
      const events = eventRepository.findToday(req.userId);
      res.json({ data: events, count: events.length, date: new Date().toISOString().split('T')[0] });
    } catch (err) { next(err); }
  },

  // GET /events/week
  getWeek(req: Request, res: Response, next: NextFunction): void {
    try {
      const events = eventRepository.findThisWeek(req.userId);
      res.json({ data: events, count: events.length });
    } catch (err) { next(err); }
  },

  // GET /events/now
  getCurrent(req: Request, res: Response, next: NextFunction): void {
    try {
      const events = eventRepository.findCurrent(req.userId);
      res.json({ data: events, count: events.length, asOf: new Date().toISOString() });
    } catch (err) { next(err); }
  },

  // GET /events/:id
  getOne(req: Request, res: Response, next: NextFunction): void {
    try {
      const event = eventRepository.findById(req.userId, req.params.id);
      if (!event) {
        problem(res, 404, 'Not Found', `Event '${req.params.id}' not found.`, req.path);
        return;
      }
      res.json({ data: event });
    } catch (err) { next(err); }
  },

  // POST /events
  create(req: Request, res: Response, next: NextFunction): void {
    try {
      const parsed = createEventSchema.safeParse(req.body);
      if (!parsed.success) {
        problem(res, 422, 'Unprocessable Entity', JSON.stringify(parsed.error.flatten().fieldErrors), req.path);
        return;
      }
      const event = eventRepository.create(req.userId, {
        title: parsed.data.title,
        description: parsed.data.description,
        location: parsed.data.location,
        startAt: parsed.data.startAt,
        endAt: parsed.data.endAt,
        allDay: parsed.data.allDay,
        timezone: parsed.data.timezone,
        recurrenceRule: parsed.data.recurrenceRule,
        status: parsed.data.status,
        category: parsed.data.category,
      });
      res.status(201).json({ data: event });
    } catch (err) { next(err); }
  },

  // PATCH /events/:id
  update(req: Request, res: Response, next: NextFunction): void {
    try {
      const parsed = updateEventSchema.safeParse(req.body);
      if (!parsed.success) {
        problem(res, 422, 'Unprocessable Entity', JSON.stringify(parsed.error.flatten().fieldErrors), req.path);
        return;
      }
      const event = eventRepository.update(req.userId, req.params.id, {
        title: parsed.data.title,
        description: parsed.data.description,
        location: parsed.data.location,
        startAt: parsed.data.startAt,
        endAt: parsed.data.endAt,
        allDay: parsed.data.allDay,
        timezone: parsed.data.timezone,
        recurrenceRule: parsed.data.recurrenceRule,
        status: parsed.data.status,
        category: parsed.data.category,
      });
      if (!event) {
        problem(res, 404, 'Not Found', `Event '${req.params.id}' not found.`, req.path);
        return;
      }
      res.json({ data: event });
    } catch (err) { next(err); }
  },

  // DELETE /events/:id
  remove(req: Request, res: Response, next: NextFunction): void {
    try {
      const deleted = eventRepository.delete(req.userId, req.params.id);
      if (!deleted) {
        problem(res, 404, 'Not Found', `Event '${req.params.id}' not found.`, req.path);
        return;
      }
      res.status(204).send();
    } catch (err) { next(err); }
  },
};
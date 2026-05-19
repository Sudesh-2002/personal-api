import { getDb, persistDb } from '@/db/connection';
import { EventRow, CalendarEvent } from '@/types';
import { randomUUID } from 'crypto';
import type { SqlValue } from 'sql.js';
import { expandRecurring } from '@/utils/recurrence';
import { fromIso } from '@/utils/date';
import { config } from '@/config';

function toEvent(row: EventRow): CalendarEvent {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    location: row.location,
    startAt: row.start_at,
    endAt: row.end_at,
    allDay: row.all_day === 1,
    timezone: row.timezone,
    recurrenceRule: row.recurrence_rule ? JSON.parse(row.recurrence_rule) : null,
    status: row.status as CalendarEvent['status'],
    category: row.category,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSql(v: unknown): SqlValue {
  if (v === null || v === undefined) return null;
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return v;
  if (typeof v === 'boolean') return v ? 1 : 0;
  return String(v);
}

function dbQuery<T>(sql: string, params: SqlValue[] = []): T[] {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) rows.push(stmt.getAsObject() as T);
  stmt.free();
  return rows;
}

function dbRun(sql: string, params: SqlValue[] = []): void {
  getDb().run(sql, params);
  persistDb();
}

export const eventRepository = {
  findAll(userId: string, filters?: { status?: string; category?: string }): CalendarEvent[] {
    let sql = 'SELECT * FROM events WHERE user_id = ?';
    const params: SqlValue[] = [userId];
    if (filters?.status) { sql += ' AND status = ?'; params.push(filters.status); }
    if (filters?.category) { sql += ' AND category = ?'; params.push(filters.category); }
    sql += ' ORDER BY start_at ASC';
    return dbQuery<EventRow>(sql, params).map(toEvent);
  },

  findById(userId: string, id: string): CalendarEvent | null {
    const rows = dbQuery<EventRow>(
      'SELECT * FROM events WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] ? toEvent(rows[0]) : null;
  },

  // Events happening now
  findCurrent(userId: string): CalendarEvent[] {
    const now = new Date().toISOString();
    const rows = dbQuery<EventRow>(
      `SELECT * FROM events WHERE user_id = ?
       AND status != 'cancelled'
       AND start_at <= ? AND end_at >= ?
       ORDER BY start_at ASC`,
      [userId, now, now]
    );
    return rows.map(toEvent);
  },

  // Events in a date range — expands recurring events
  findInRange(userId: string, start: Date, end: Date): CalendarEvent[] {
    const rows = dbQuery<EventRow>(
      `SELECT * FROM events WHERE user_id = ?
       AND status != 'cancelled'
       AND (
         (start_at >= ? AND start_at <= ?)
         OR recurrence_rule IS NOT NULL
       )
       ORDER BY start_at ASC`,
      [userId, toSql(start.toISOString()), toSql(end.toISOString())]
    );

    const events = rows.map(toEvent);
    const expanded: CalendarEvent[] = [];

    for (const event of events) {
      if (event.recurrenceRule) {
        expanded.push(...expandRecurring(event, start, end));
      } else {
        expanded.push(event);
      }
    }

    return expanded.sort((a, b) => a.startAt.localeCompare(b.startAt));
  },

  // Today's events
  findToday(userId: string): CalendarEvent[] {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date();
    end.setUTCHours(23, 59, 59, 999);
    return this.findInRange(userId, start, end);
  },

  // This week's events
  findThisWeek(userId: string): CalendarEvent[] {
    const now = new Date();
    const day = now.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    const start = new Date(now);
    start.setUTCDate(now.getUTCDate() + diff);
    start.setUTCHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);
    end.setUTCHours(23, 59, 59, 999);
    return this.findInRange(userId, start, end);
  },

  create(userId: string, data: {
    title: string;
    description?: string;
    location?: string;
    startAt: string;
    endAt: string;
    allDay?: boolean;
    timezone?: string;
    recurrenceRule?: object;
    status?: string;
    category?: string;
  }): CalendarEvent {
    const id = randomUUID();
    dbRun(
      `INSERT INTO events
        (id, user_id, title, description, location, start_at, end_at,
         all_day, timezone, recurrence_rule, status, category)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        id, userId, data.title,
        toSql(data.description),
        toSql(data.location),
        data.startAt, data.endAt,
        data.allDay ? 1 : 0,
        data.timezone ?? config.DEFAULT_TIMEZONE,
        data.recurrenceRule ? toSql(JSON.stringify(data.recurrenceRule)) : null,
        data.status ?? 'confirmed',
        data.category ?? 'general',
      ]
    );
    return this.findById(userId, id)!;
  },

  update(userId: string, id: string, data: Partial<{
    title: string;
    description: string;
    location: string;
    startAt: string;
    endAt: string;
    allDay: boolean;
    timezone: string;
    recurrenceRule: object | null;
    status: string;
    category: string;
  }>): CalendarEvent | null {
    const existing = this.findById(userId, id);
    if (!existing) return null;

    const merged = { ...existing, ...data };
    dbRun(
      `UPDATE events SET
        title = ?, description = ?, location = ?, start_at = ?, end_at = ?,
        all_day = ?, timezone = ?, recurrence_rule = ?, status = ?, category = ?
       WHERE id = ? AND user_id = ?`,
      [
        merged.title,
        toSql(merged.description),
        toSql(merged.location),
        merged.startAt,
        merged.endAt,
        merged.allDay ? 1 : 0,
        merged.timezone,
        merged.recurrenceRule ? toSql(JSON.stringify(merged.recurrenceRule)) : null,
        merged.status,
        merged.category,
        id, userId,
      ]
    );
    return this.findById(userId, id)!;
  },

  delete(userId: string, id: string): boolean {
    const existing = this.findById(userId, id);
    if (!existing) return false;
    dbRun('DELETE FROM events WHERE id = ? AND user_id = ?', [id, userId]);
    return true;
  },
};
import { getDb, persistDb } from '@/db/connection';
import { Preference, PreferenceRow } from '@/types';
import { randomUUID } from 'crypto';
import type { SqlValue } from 'sql.js';

function toPreference(row: PreferenceRow): Preference {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category,
    key: row.key,
    value: parseValue(row.value, row.value_type),
    valueType: row.value_type,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function parseValue(raw: string, type: string): unknown {
  try {
    if (type === 'string') return raw;
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function serializeValue(value: unknown): { serialized: string; type: string } {
  if (typeof value === 'string') return { serialized: value, type: 'string' };
  if (typeof value === 'number') return { serialized: JSON.stringify(value), type: 'number' };
  if (typeof value === 'boolean') return { serialized: JSON.stringify(value), type: 'boolean' };
  if (Array.isArray(value)) return { serialized: JSON.stringify(value), type: 'array' };
  return { serialized: JSON.stringify(value), type: 'object' };
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
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return rows;
}

function dbRun(sql: string, params: SqlValue[] = []): void {
  getDb().run(sql, params);
  persistDb();
}

export const preferenceRepository = {
  findAll(userId: string, category?: string): Preference[] {
    const rows = category
      ? dbQuery<PreferenceRow>(
          'SELECT * FROM preferences WHERE user_id = ? AND category = ? ORDER BY category, key',
          [userId, category]
        )
      : dbQuery<PreferenceRow>(
          'SELECT * FROM preferences WHERE user_id = ? ORDER BY category, key',
          [userId]
        );
    return rows.map(toPreference);
  },

  findById(userId: string, id: string): Preference | null {
    const rows = dbQuery<PreferenceRow>(
      'SELECT * FROM preferences WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] ? toPreference(rows[0]) : null;
  },

  findByKey(userId: string, category: string, key: string): Preference | null {
    const rows = dbQuery<PreferenceRow>(
      'SELECT * FROM preferences WHERE user_id = ? AND category = ? AND key = ?',
      [userId, category, key]
    );
    return rows[0] ? toPreference(rows[0]) : null;
  },

  create(
    userId: string,
    data: { category: string; key: string; value: unknown; description?: string }
  ): Preference {
    const id = randomUUID();
    const { serialized, type } = serializeValue(data.value);
    dbRun(
      `INSERT INTO preferences (id, user_id, category, key, value, value_type, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, data.category, data.key, serialized, type, toSql(data.description)]
    );
    return this.findById(userId, id)!;
  },

  update(
    userId: string,
    id: string,
    data: { value?: unknown; description?: string }
  ): Preference | null {
    const existing = this.findById(userId, id);
    if (!existing) return null;
    const newValue = data.value !== undefined ? data.value : existing.value;
    const { serialized, type } = serializeValue(newValue);
    const description = data.description !== undefined ? data.description : existing.description;
    dbRun(
      `UPDATE preferences SET value = ?, value_type = ?, description = ?
       WHERE id = ? AND user_id = ?`,
      [serialized, type, toSql(description), id, userId]
    );
    return this.findById(userId, id)!;
  },

  delete(userId: string, id: string): boolean {
    const existing = this.findById(userId, id);
    if (!existing) return false;
    dbRun('DELETE FROM preferences WHERE id = ? AND user_id = ?', [id, userId]);
    return true;
  },

  upsert(
    userId: string,
    data: { category: string; key: string; value: unknown; description?: string }
  ): Preference {
    const { serialized, type } = serializeValue(data.value);
    const id = randomUUID();
    dbRun(
      `INSERT INTO preferences (id, user_id, category, key, value, value_type, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, category, key) DO UPDATE SET
         value = excluded.value,
         value_type = excluded.value_type,
         description = COALESCE(excluded.description, description)`,
      [id, userId, data.category, data.key, serialized, type, toSql(data.description)]
    );
    return this.findByKey(userId, data.category, data.key)!;
  },
};
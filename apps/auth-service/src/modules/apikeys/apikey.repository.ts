import { getDb, persistDb } from '@/db/connection';
import { ApiKeyRow, ApiKey } from '@/types';
import { generateApiKey, hashKey, keyPrefix } from '@/utils/crypto';
import { randomUUID } from 'crypto';
import type { SqlValue } from 'sql.js';

function toApiKey(row: ApiKeyRow): ApiKey {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    keyPrefix: row.key_prefix,
    scope: row.scope.split(' ').filter(Boolean),
    expiresAt: row.expires_at,
    lastUsedAt: row.last_used_at,
    isActive: row.is_active === 1,
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

export const apiKeyRepository = {
  findAll(userId: string): ApiKey[] {
    return dbQuery<ApiKeyRow>(
      'SELECT * FROM api_keys WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    ).map(toApiKey);
  },

  findById(userId: string, id: string): ApiKey | null {
    const rows = dbQuery<ApiKeyRow>(
      'SELECT * FROM api_keys WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0] ? toApiKey(rows[0]) : null;
  },

  findByHash(keyHash: string): ApiKeyRow | null {
    const rows = dbQuery<ApiKeyRow>(
      'SELECT * FROM api_keys WHERE key_hash = ? AND is_active = 1',
      [keyHash]
    );
    return rows[0] ?? null;
  },

  create(userId: string, data: {
    name: string;
    scope: string[];
    expiresAt?: string;
  }): { apiKey: ApiKey; rawKey: string } {
    const id = randomUUID();
    const rawKey = generateApiKey();
    const hash = hashKey(rawKey);
    const prefix = keyPrefix(rawKey);

    dbRun(
      `INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix, scope, expires_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, data.name, hash, prefix,
       data.scope.join(' '), toSql(data.expiresAt)]
    );

    return {
      apiKey: this.findById(userId, id)!,
      rawKey,
    };
  },

  updateLastUsed(id: string): void {
    dbRun(
      `UPDATE api_keys SET last_used_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
       WHERE id = ?`,
      [id]
    );
  },

  revoke(userId: string, id: string): boolean {
    const existing = this.findById(userId, id);
    if (!existing) return false;
    dbRun(
      'UPDATE api_keys SET is_active = 0 WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return true;
  },

  delete(userId: string, id: string): boolean {
    const existing = this.findById(userId, id);
    if (!existing) return false;
    dbRun('DELETE FROM api_keys WHERE id = ? AND user_id = ?', [id, userId]);
    return true;
  },
};
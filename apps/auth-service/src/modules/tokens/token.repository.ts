import { getDb, persistDb } from '@/db/connection';
import { RefreshTokenRow } from '@/types';
import { hashKey } from '@/utils/crypto';
import { randomUUID } from 'crypto';
import type { SqlValue } from 'sql.js';

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

export const tokenRepository = {
  create(userId: string, apiKeyId: string, rawToken: string, ttlSeconds: number): void {
    const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
    dbRun(
      `INSERT INTO refresh_tokens (id, user_id, api_key_id, token_hash, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      [randomUUID(), userId, apiKeyId, hashKey(rawToken), expiresAt]
    );
  },

  findByToken(rawToken: string): RefreshTokenRow | null {
    const rows = dbQuery<RefreshTokenRow>(
      `SELECT * FROM refresh_tokens
       WHERE token_hash = ? AND is_revoked = 0 AND expires_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`,
      [hashKey(rawToken)]
    );
    return rows[0] ?? null;
  },

  revoke(rawToken: string): boolean {
    const existing = this.findByToken(rawToken);
    if (!existing) return false;
    dbRun(
      'UPDATE refresh_tokens SET is_revoked = 1 WHERE token_hash = ?',
      [hashKey(rawToken)]
    );
    return true;
  },

  revokeAllForKey(apiKeyId: string): void {
    dbRun(
      'UPDATE refresh_tokens SET is_revoked = 1 WHERE api_key_id = ?',
      [apiKeyId]
    );
  },

  // Cleanup expired tokens (call periodically)
  purgeExpired(): number {
    const db = getDb();
    db.run(
      `DELETE FROM refresh_tokens
       WHERE expires_at <= strftime('%Y-%m-%dT%H:%M:%fZ', 'now') OR is_revoked = 1`
    );
    persistDb();
    return 0;
  },
};
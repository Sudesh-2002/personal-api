import { getDb, persistDb } from './connection';
import { logger } from '@/utils/logger';

export function runMigrations(): void {
  const db = getDb();

  db.run(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    INTEGER PRIMARY KEY,
      name       TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);

  const migrations = [
    {
      version: 1,
      name: 'create_api_keys_table',
      sql: `
        CREATE TABLE IF NOT EXISTS api_keys (
          id           TEXT PRIMARY KEY,
          user_id      TEXT NOT NULL,
          name         TEXT NOT NULL,
          key_hash     TEXT NOT NULL UNIQUE,
          key_prefix   TEXT NOT NULL,
          scope        TEXT NOT NULL DEFAULT 'read',
          expires_at   TEXT,
          last_used_at TEXT,
          is_active    INTEGER NOT NULL DEFAULT 1 CHECK(is_active IN (0,1)),
          created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
          updated_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
        CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
        CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
      `,
    },
    {
      version: 2,
      name: 'create_refresh_tokens_table',
      sql: `
        CREATE TABLE IF NOT EXISTS refresh_tokens (
          id          TEXT PRIMARY KEY,
          user_id     TEXT NOT NULL,
          api_key_id  TEXT NOT NULL REFERENCES api_keys(id) ON DELETE CASCADE,
          token_hash  TEXT NOT NULL UNIQUE,
          expires_at  TEXT NOT NULL,
          is_revoked  INTEGER NOT NULL DEFAULT 0 CHECK(is_revoked IN (0,1)),
          created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );
        CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
        CREATE INDEX IF NOT EXISTS idx_refresh_tokens_api_key ON refresh_tokens(api_key_id);
      `,
    },
    {
      version: 3,
      name: 'create_api_keys_updated_at_trigger',
      sql: `
        CREATE TRIGGER IF NOT EXISTS api_keys_updated_at
        AFTER UPDATE ON api_keys FOR EACH ROW
        BEGIN
          UPDATE api_keys
          SET updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
          WHERE id = OLD.id;
        END;
      `,
    },
  ];

  const applied = db.exec('SELECT version FROM schema_migrations');
  const appliedVersions = new Set<number>(
    applied.length > 0 ? (applied[0].values as number[][]).map((r) => r[0]) : []
  );

  for (const m of migrations) {
    if (appliedVersions.has(m.version)) continue;
    db.run(m.sql);
    db.run('INSERT INTO schema_migrations (version, name) VALUES (?, ?)', [m.version, m.name]);
    logger.info({ version: m.version, name: m.name }, '✅ Migration applied');
  }

  persistDb();
  logger.info('Auth DB migrations complete');
}
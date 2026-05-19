import { getDb, persistDb } from './connection';
import { logger } from '@/utils/logger';

export function runMigrations(): void {
  const db = getDb();
  logger.info('Running database migrations...');

  db.run(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    INTEGER PRIMARY KEY,
      name       TEXT NOT NULL,
      applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
    );
  `);

  const migrations: Array<{ version: number; name: string; sql: string }> = [
    {
      version: 1,
      name: 'create_preferences_table',
      sql: `
        CREATE TABLE IF NOT EXISTS preferences (
          id          TEXT PRIMARY KEY,
          user_id     TEXT NOT NULL,
          category    TEXT NOT NULL DEFAULT 'general',
          key         TEXT NOT NULL,
          value       TEXT NOT NULL,
          value_type  TEXT NOT NULL DEFAULT 'string',
          description TEXT,
          created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
          updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
          UNIQUE(user_id, category, key)
        );
        CREATE INDEX IF NOT EXISTS idx_preferences_user_id ON preferences(user_id);
        CREATE INDEX IF NOT EXISTS idx_preferences_user_category ON preferences(user_id, category);
      `,
    },
    {
      version: 2,
      name: 'create_updated_at_trigger',
      sql: `
        CREATE TRIGGER IF NOT EXISTS preferences_updated_at
        AFTER UPDATE ON preferences FOR EACH ROW
        BEGIN
          UPDATE preferences
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

  for (const migration of migrations) {
    if (appliedVersions.has(migration.version)) {
      logger.debug({ version: migration.version }, 'Migration already applied, skipping');
      continue;
    }
    db.run(migration.sql);
    db.run('INSERT INTO schema_migrations (version, name) VALUES (?, ?)', [
      migration.version,
      migration.name,
    ]);
    logger.info({ version: migration.version, name: migration.name }, '✅ Migration applied');
  }

  persistDb();
  logger.info('Migrations complete');
}
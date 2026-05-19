import { getDb, persistDb } from './connection';
import { logger } from '@/utils/logger';

export function runMigrations(): void {
  const db = getDb();
  logger.info('Running schedule DB migrations...');

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
      name: 'create_events_table',
      sql: `
        CREATE TABLE IF NOT EXISTS events (
          id              TEXT PRIMARY KEY,
          user_id         TEXT NOT NULL,
          title           TEXT NOT NULL,
          description     TEXT,
          location        TEXT,
          start_at        TEXT NOT NULL,
          end_at          TEXT NOT NULL,
          all_day         INTEGER NOT NULL DEFAULT 0 CHECK(all_day IN (0,1)),
          timezone        TEXT NOT NULL DEFAULT 'UTC',
          recurrence_rule TEXT,
          status          TEXT NOT NULL DEFAULT 'confirmed'
                            CHECK(status IN ('confirmed','tentative','cancelled')),
          category        TEXT NOT NULL DEFAULT 'general',
          created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
          updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        );

        CREATE INDEX IF NOT EXISTS idx_events_user_id
          ON events(user_id);

        CREATE INDEX IF NOT EXISTS idx_events_start_at
          ON events(user_id, start_at);

        CREATE INDEX IF NOT EXISTS idx_events_status
          ON events(user_id, status);
      `,
    },
    {
      version: 2,
      name: 'create_events_updated_at_trigger',
      sql: `
        CREATE TRIGGER IF NOT EXISTS events_updated_at
        AFTER UPDATE ON events FOR EACH ROW
        BEGIN
          UPDATE events
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
  logger.info('Schedule DB migrations complete');
}
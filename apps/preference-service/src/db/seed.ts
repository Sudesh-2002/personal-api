import { initDb, getDb, persistDb } from './connection';
import { runMigrations } from './migrate';
import { logger } from '@/utils/logger';
import { randomUUID } from 'crypto';

async function seed(): Promise<void> {
  await initDb();
  runMigrations();

  const db = getDb();
  const userId = 'user_default';

  const seeds = [
    { category: 'ui', key: 'theme', value: 'dark', valueType: 'string', description: 'UI theme' },
    { category: 'ui', key: 'language', value: 'en-US', valueType: 'string', description: 'Display language' },
    { category: 'ui', key: 'timezone', value: 'Asia/Colombo', valueType: 'string', description: 'Local timezone' },
    { category: 'notifications', key: 'email_enabled', value: 'true', valueType: 'boolean', description: 'Email notifications' },
    { category: 'notifications', key: 'push_enabled', value: 'false', valueType: 'boolean', description: 'Push notifications' },
    { category: 'privacy', key: 'analytics_opt_in', value: 'false', valueType: 'boolean', description: 'Analytics consent' },
  ];

  for (const s of seeds) {
    db.run(
      `INSERT OR IGNORE INTO preferences (id, user_id, category, key, value, value_type, description)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), userId, s.category, s.key, s.value, s.valueType, s.description]
    );
  }

  persistDb();
  logger.info({ count: seeds.length, userId }, '🌱 Seed data inserted');
}

seed().catch((err) => { console.error(err); process.exit(1); });
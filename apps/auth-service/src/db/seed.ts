import { initDb, getDb, persistDb } from './connection';
import { runMigrations } from './migrate';
import { generateApiKey, hashKey, keyPrefix } from '@/utils/crypto';
import { logger } from '@/utils/logger';
import { randomUUID } from 'crypto';

async function seed(): Promise<void> {
  await initDb();
  runMigrations();

  const db = getDb();
  const userId = 'user_default';

  // Check if seed key already exists
  const existing = db.exec(
    `SELECT id FROM api_keys WHERE user_id = ? AND name = 'Default Key'`,
    [userId]
  );
  if (existing.length > 0 && existing[0].values.length > 0) {
    logger.info('Seed API key already exists, skipping');
    return;
  }

  const rawKey = generateApiKey();
  const id = randomUUID();

  db.run(
    `INSERT INTO api_keys (id, user_id, name, key_hash, key_prefix, scope)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [id, userId, 'Default Key', hashKey(rawKey), keyPrefix(rawKey), 'read write']
  );

  persistDb();

  // Print the key — this is the ONLY time it is shown
  logger.info('🔑 Default API key created (save this — shown only once):');
  console.log('\n========================================');
  console.log(`API Key: ${rawKey}`);
  console.log(`Key ID:  ${id}`);
  console.log(`Scope:   read write`);
  console.log('========================================\n');
}

seed().catch((err) => { console.error(err); process.exit(1); });
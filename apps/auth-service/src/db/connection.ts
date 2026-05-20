import initSqlJs, { Database } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { config } from '@/config';
import { logger } from '@/utils/logger';

const dbPath = path.resolve(config.DB_PATH);
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let _db: Database;

export async function initDb(): Promise<Database> {
  if (_db) return _db;
  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    _db = new SQL.Database(fs.readFileSync(dbPath));
    logger.info({ dbPath }, 'Auth DB loaded from disk');
  } else {
    _db = new SQL.Database();
    logger.info({ dbPath }, 'Auth DB created (new)');
  }
  return _db;
}

export function getDb(): Database {
  if (!_db) throw new Error('Database not initialized. Call initDb() first.');
  return _db;
}

export function persistDb(): void {
  fs.writeFileSync(dbPath, Buffer.from(_db.export()));
}
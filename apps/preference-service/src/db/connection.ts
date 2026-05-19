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

// sql.js is async — export a promise, resolved once at startup
let _db: Database;

export async function initDb(): Promise<Database> {
  if (_db) return _db;

  const SQL = await initSqlJs();

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    _db = new SQL.Database(fileBuffer);
    logger.info({ dbPath }, 'SQLite database loaded from disk');
  } else {
    _db = new SQL.Database();
    logger.info({ dbPath }, 'SQLite database created (new)');
  }

  // Save to disk on every write — call this after mutations
  return _db;
}

export function getDb(): Database {
  if (!_db) throw new Error('Database not initialized. Call initDb() first.');
  return _db;
}

// Persist in-memory state to disk after each write
export function persistDb(): void {
  const data = _db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}
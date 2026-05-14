import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { getConfig } from '../config.js';

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) return db;

  const config = getConfig();
  const dbPath = path.resolve(config.DB_PATH);
  const dbDir = path.dirname(dbPath);

  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  console.log(`📦 SQLite database opened at ${dbPath}`);
  return db;
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
    console.log('📦 SQLite database closed');
  }
}

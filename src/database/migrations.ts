import { getDatabase } from './connection.js';

export function runMigrations(): void {
  const db = getDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS generations (
      id TEXT PRIMARY KEY,
      ad_creative TEXT NOT NULL,
      landing_url TEXT NOT NULL,
      original_content TEXT NOT NULL,
      pipeline_result TEXT NOT NULL,
      evaluation_scores TEXT NOT NULL,
      screenshot_path TEXT,
      ad_image TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_generations_created_at
      ON generations(created_at DESC);
  `);

  // Migration: add ad_image column to existing tables that lack it
  try {
    db.exec(`ALTER TABLE generations ADD COLUMN ad_image TEXT`);
  } catch {
    // Column already exists — safe to ignore
  }

  console.log('📦 Database migrations complete');
}

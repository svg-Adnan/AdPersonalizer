import { randomUUID } from 'crypto';
import { getDatabase } from './connection.js';
import type { GenerationRecord, PipelineResult, ScrapedPage, EvaluationScores } from '../types.js';

export interface SaveGenerationInput {
  adCreative: string;
  landingUrl: string;
  originalContent: ScrapedPage;
  pipelineResult: PipelineResult;
  evaluationScores: EvaluationScores;
  screenshotPath?: string | null;
  adImage?: string | null;
}

export function saveGeneration(input: SaveGenerationInput): string {
  const db = getDatabase();
  const id = randomUUID();

  const stmt = db.prepare(`
    INSERT INTO generations (id, ad_creative, landing_url, original_content, pipeline_result, evaluation_scores, screenshot_path, ad_image)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    input.adCreative,
    input.landingUrl,
    JSON.stringify(input.originalContent),
    JSON.stringify(input.pipelineResult),
    JSON.stringify(input.evaluationScores),
    input.screenshotPath || null,
    input.adImage || null
  );

  return id;
}

export function getGenerations(limit = 20, offset = 0): GenerationRecord[] {
  const db = getDatabase();
  const stmt = db.prepare(
    'SELECT * FROM generations ORDER BY created_at DESC LIMIT ? OFFSET ?'
  );
  return stmt.all(limit, offset) as GenerationRecord[];
}

export function getGenerationById(id: string): GenerationRecord | undefined {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM generations WHERE id = ?');
  return stmt.get(id) as GenerationRecord | undefined;
}

export function deleteGeneration(id: string): boolean {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM generations WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

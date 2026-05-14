import type { Response } from 'express';
import { analyzeAd } from './stages/adAnalyzer.js';
import { analyzeLandingPage } from './stages/landingAnalyzer.js';
import { matchTone } from './stages/toneMatcher.js';
import { generateCopy } from './stages/copyGenerator.js';
import { generateTheme } from './stages/themeGenerator.js';
import { evaluateOutput } from './evaluator.js';
import type { ScrapedPage, PipelineResult, PipelineStage } from '../../types.js';

// ─── SSE Helper ─────────────────────────────────────────────────
function sendStageEvent(
  res: Response,
  stage: PipelineStage,
  status: 'running' | 'complete' | 'error',
  result?: unknown,
  error?: string
): void {
  const data = JSON.stringify({ stage, status, result, error });
  res.write(`event: stage\ndata: ${data}\n\n`);
}

// ─── Pipeline Orchestrator ──────────────────────────────────────
export async function runPipeline(
  adCreativeText: string,
  adImageBase64: string | undefined,
  scrapedPage: ScrapedPage,
  res: Response
): Promise<PipelineResult> {
  // Stage 1: Ad Analysis
  sendStageEvent(res, 'ad_analysis', 'running');
  console.log('🔍 Stage 1: Analyzing ad creative...');
  const adAnalysis = await analyzeAd(adCreativeText, adImageBase64);
  sendStageEvent(res, 'ad_analysis', 'complete', adAnalysis);

  // Stage 2: Landing Page Analysis
  sendStageEvent(res, 'landing_analysis', 'running');
  console.log('🔍 Stage 2: Analyzing landing page...');
  const landingAnalysis = await analyzeLandingPage(scrapedPage);
  sendStageEvent(res, 'landing_analysis', 'complete', landingAnalysis);

  // Stage 3: Tone Matching
  sendStageEvent(res, 'tone_matching', 'running');
  console.log('🔍 Stage 3: Matching tone...');
  const toneMatch = await matchTone(adAnalysis, landingAnalysis);
  sendStageEvent(res, 'tone_matching', 'complete', toneMatch);

  // Stage 4: Copy Generation
  sendStageEvent(res, 'copy_generation', 'running');
  console.log('✍️  Stage 4: Generating copy...');
  const copy = await generateCopy(scrapedPage, adAnalysis, toneMatch);
  sendStageEvent(res, 'copy_generation', 'complete', copy);

  // Stage 5: Theme Generation
  sendStageEvent(res, 'theme_generation', 'running');
  console.log('🎨 Stage 5: Generating theme...');
  const theme = await generateTheme(adAnalysis, copy);
  sendStageEvent(res, 'theme_generation', 'complete', theme);

  // Stage 6: Evaluation
  sendStageEvent(res, 'evaluation', 'running');
  console.log('📊 Stage 6: Evaluating output...');
  const evaluation = await evaluateOutput(adAnalysis, copy);
  sendStageEvent(res, 'evaluation', 'complete', evaluation);

  return { adAnalysis, landingAnalysis, toneMatch, copy, theme, evaluation };
}

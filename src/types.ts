// ─── Scraped Page ───────────────────────────────────────────────
export interface ScrapedPage {
  headline: string;
  subheadline: string;
  cta: string;
  sections: string[];
  screenshotPath?: string;
  screenshotBase64?: string;
}

// ─── AI Pipeline Stage Outputs ──────────────────────────────────
export interface AdAnalysis {
  audience: string;
  promise: string;
  tone: string;
  benefits: string[];
  urgency_level: 'low' | 'medium' | 'high';
}

export interface LandingAnalysis {
  content_quality: string;
  relevance_score: number;
  strengths: string[];
  weaknesses: string[];
  visual_observations?: string;
}

export interface ToneMatch {
  alignment_score: number;
  gaps: string[];
  recommendations: string[];
}

export interface SectionImprovement {
  original: string;
  improved: string;
  explanation: string;
}

export interface CopyOutput {
  headline: string;
  subheadline: string;
  cta: string;
  section_improvements: SectionImprovement[];
  reasoning: string[];
}

export interface ThemeOutput {
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  cardBg: string;
  fontFamily: 'Inter' | 'Montserrat' | 'Playfair Display' | 'Roboto Mono';
}

export interface EvaluationScores {
  tone_match_score: number;
  cta_strength: number;
  emotional_consistency: number;
  overall_score: number;
  feedback: string[];
}

// ─── Pipeline Result ────────────────────────────────────────────
export interface PipelineResult {
  adAnalysis: AdAnalysis;
  landingAnalysis: LandingAnalysis;
  toneMatch: ToneMatch;
  copy: CopyOutput;
  theme: ThemeOutput;
  evaluation: EvaluationScores;
}

// ─── API Response ───────────────────────────────────────────────
export interface PersonalizeResponse {
  original: ScrapedPage;
  headline: string;
  subheadline: string;
  cta: string;
  section_improvements: SectionImprovement[];
  reasoning: string[];
  appTheme: ThemeOutput;
  analysis: AdAnalysis;
  toneMatch: ToneMatch;
  landingAnalysis: LandingAnalysis;
  evaluation: EvaluationScores;
  historyId: string;
}

// ─── SSE Events ─────────────────────────────────────────────────
export type PipelineStage =
  | 'scraping'
  | 'ad_analysis'
  | 'landing_analysis'
  | 'tone_matching'
  | 'copy_generation'
  | 'theme_generation'
  | 'evaluation';

export interface StageEvent {
  stage: PipelineStage;
  status: 'running' | 'complete' | 'error';
  result?: unknown;
  error?: string;
}

// ─── Database Record ────────────────────────────────────────────
export interface GenerationRecord {
  id: string;
  ad_creative: string;
  landing_url: string;
  original_content: string; // JSON stringified ScrapedPage
  pipeline_result: string;  // JSON stringified PipelineResult
  evaluation_scores: string; // JSON stringified EvaluationScores
  screenshot_path: string | null;
  ad_image: string | null;
  created_at: string;
}

// ─── Stage function signature ───────────────────────────────────
export interface AIStageContext {
  adCreativeText: string;
  adImageBase64?: string;
  scrapedPage: ScrapedPage;
  adAnalysis?: AdAnalysis;
  landingAnalysis?: LandingAnalysis;
  toneMatch?: ToneMatch;
  copy?: CopyOutput;
  theme?: ThemeOutput;
}

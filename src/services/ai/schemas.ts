import { z } from 'zod';

// ─── Stage 1: Ad Analysis ───────────────────────────────────────
export const AdAnalysisSchema = z.object({
  audience: z.string().min(1),
  promise: z.string().min(1),
  tone: z.string().min(1),
  benefits: z.array(z.string()).min(1),
  urgency_level: z.enum(['low', 'medium', 'high']),
});

// ─── Stage 2: Landing Page Analysis ─────────────────────────────
export const LandingAnalysisSchema = z.object({
  content_quality: z.string().min(1),
  relevance_score: z.number().min(0).max(10),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  visual_observations: z.string().optional(),
});

// ─── Stage 3: Tone Match ────────────────────────────────────────
export const ToneMatchSchema = z.object({
  alignment_score: z.number().min(0).max(10),
  gaps: z.array(z.string()),
  recommendations: z.array(z.string()).min(1),
});

// ─── Stage 4: Copy Output ───────────────────────────────────────
export const SectionImprovementSchema = z.object({
  original: z.string(),
  improved: z.string().min(1),
  explanation: z.string().min(1),
});

export const CopyOutputSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().min(1),
  cta: z.string().min(1),
  section_improvements: z.array(SectionImprovementSchema).min(1),
  reasoning: z.array(z.string()).min(1),
});

// ─── Stage 5: Theme Output ─────────────────────────────────────
export const ThemeOutputSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color'),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color'),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex color'),
  cardBg: z.string().min(1),
  fontFamily: z.enum(['Inter', 'Montserrat', 'Playfair Display', 'Roboto Mono']),
});

// ─── Evaluation Scores ─────────────────────────────────────────
export const EvaluationSchema = z.object({
  tone_match_score: z.number().min(0).max(10),
  cta_strength: z.number().min(0).max(10),
  emotional_consistency: z.number().min(0).max(10),
  overall_score: z.number().min(0).max(10),
  feedback: z.array(z.string()).min(1),
});

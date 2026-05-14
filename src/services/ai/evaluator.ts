import { completionWithValidation } from './client.js';
import { EvaluationSchema } from './schemas.js';
import type { AdAnalysis, CopyOutput, EvaluationScores } from '../../types.js';

export async function evaluateOutput(
  adAnalysis: AdAnalysis,
  copy: CopyOutput
): Promise<EvaluationScores> {
  const prompt = `You are a CRO (Conversion Rate Optimization) evaluator. Score the quality of the generated landing page copy relative to the ad creative.

AD ANALYSIS:
- Audience: ${adAnalysis.audience}
- Promise: ${adAnalysis.promise}
- Tone: ${adAnalysis.tone}
- Urgency: ${adAnalysis.urgency_level}

GENERATED COPY:
- Headline: "${copy.headline}"
- Subheadline: "${copy.subheadline}"
- CTA: "${copy.cta}"
- Sections: ${copy.section_improvements.map((s) => s.improved).join(' | ')}

Score each dimension from 0-10:
- "tone_match_score": How well does the copy match the ad's tone?
- "cta_strength": How compelling is the call-to-action?
- "emotional_consistency": Is the emotional arc coherent across all sections?
- "overall_score": Weighted average (tone 40%, CTA 30%, emotional 30%)
- "feedback": Array of specific improvement suggestions

Respond ONLY with valid JSON.`;

  const result = await completionWithValidation({
    prompt,
    schema: EvaluationSchema,
  });

  if (result.success) return result.data;

  console.warn('Evaluation fallback:', result.error);
  return {
    tone_match_score: 7,
    cta_strength: 7,
    emotional_consistency: 7,
    overall_score: 7,
    feedback: ['Generated with fallback scoring. Re-run for accurate evaluation.'],
  };
}

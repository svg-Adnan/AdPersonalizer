import { completionWithValidation } from '../client.js';
import { ToneMatchSchema } from '../schemas.js';
import type { AdAnalysis, LandingAnalysis, ToneMatch } from '../../../types.js';

export async function matchTone(
  adAnalysis: AdAnalysis,
  landingAnalysis: LandingAnalysis
): Promise<ToneMatch> {
  const prompt = `You are a brand voice and tone consistency expert. Compare the ad creative analysis with the landing page analysis and identify alignment gaps.

AD ANALYSIS:
- Target Audience: ${adAnalysis.audience}
- Core Promise: ${adAnalysis.promise}
- Tone: ${adAnalysis.tone}
- Key Benefits: ${adAnalysis.benefits.join(', ')}
- Urgency Level: ${adAnalysis.urgency_level}

LANDING PAGE ANALYSIS:
- Content Quality: ${landingAnalysis.content_quality}
- Relevance Score: ${landingAnalysis.relevance_score}/10
- Strengths: ${landingAnalysis.strengths.join(', ')}
- Weaknesses: ${landingAnalysis.weaknesses.join(', ')}

Respond with a JSON object containing:
- "alignment_score": 0-10 score of how well the landing page tone matches the ad
- "gaps": array of specific tone/message misalignments
- "recommendations": array of specific actions to align the landing page with the ad's tone and promise

Respond ONLY with valid JSON.`;

  const result = await completionWithValidation({
    prompt,
    schema: ToneMatchSchema,
  });

  if (result.success) return result.data;

  console.warn('Tone match fallback:', result.error);
  return {
    alignment_score: 4,
    gaps: ['Generic landing page tone does not match ad specificity'],
    recommendations: ['Align headline with ad promise', 'Match urgency level', 'Carry ad benefits through sections'],
  };
}

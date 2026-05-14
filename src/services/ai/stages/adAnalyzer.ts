import { completionWithValidation, visionCompletion } from '../client.js';
import { AdAnalysisSchema } from '../schemas.js';
import { wrapUserContent } from '../../../middleware/security.js';
import type { AdAnalysis } from '../../../types.js';

export async function analyzeAd(
  adCreativeText: string,
  adImageBase64?: string
): Promise<AdAnalysis> {
  let combinedInput = adCreativeText || '';

  // If we have an image, run vision analysis first
  if (adImageBase64) {
    console.log('  📸 Running vision analysis on ad image...');
    const visionContext = await visionCompletion(
      'Describe the ad copy, the characters, the visual art style, the overall tone, and the core promise from this image. Be highly specific so we can use this to adapt a landing page.',
      adImageBase64
    );
    combinedInput += `\n\n[IMAGE VISUAL CONTEXT EXTRACTED BY VISION AI]\n${visionContext}`;
  }

  const prompt = `You are an expert ad creative analyst. Analyze the following ad creative and extract structured insights.

AD CREATIVE:
${wrapUserContent(combinedInput)}

Respond with a JSON object containing:
- "audience": who this ad targets (be specific about demographics, psychographics)
- "promise": the core value proposition or promise being made
- "tone": the overall tone/voice (e.g., "urgent and motivational", "calm and professional")
- "benefits": an array of specific benefits mentioned or implied
- "urgency_level": one of "low", "medium", or "high"

Respond ONLY with valid JSON.`;

  const result = await completionWithValidation({
    prompt,
    schema: AdAnalysisSchema,
  });

  if (result.success) return result.data;

  // Fallback
  console.warn('Ad analysis fallback:', result.error);
  return {
    audience: 'General audience interested in the advertised product/service',
    promise: adCreativeText.split(' ').slice(0, 10).join(' '),
    tone: 'professional and engaging',
    benefits: ['Quality product/service', 'Proven results'],
    urgency_level: 'medium',
  };
}

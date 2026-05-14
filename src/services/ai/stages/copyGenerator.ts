import { completionWithValidation } from '../client.js';
import { CopyOutputSchema } from '../schemas.js';
import { wrapUserContent } from '../../../middleware/security.js';
import type { AdAnalysis, ToneMatch, ScrapedPage, CopyOutput } from '../../../types.js';

export async function generateCopy(
  scrapedPage: ScrapedPage,
  adAnalysis: AdAnalysis,
  toneMatch: ToneMatch
): Promise<CopyOutput> {
  const prompt = `You are a landing page copywriter. Generate personalized landing page copy that aligns with the ad creative.

ORIGINAL PAGE CONTENT:
- Headline: "${scrapedPage.headline}"
- Subheadline: "${scrapedPage.subheadline}"
- CTA: "${scrapedPage.cta}"
- Sections: ${JSON.stringify(scrapedPage.sections)}

AD INSIGHTS:
- Audience: ${adAnalysis.audience}
- Promise: ${wrapUserContent(adAnalysis.promise)}
- Tone: ${adAnalysis.tone}
- Benefits: ${adAnalysis.benefits.join(', ')}
- Urgency: ${adAnalysis.urgency_level}

TONE RECOMMENDATIONS:
${toneMatch.recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n')}

RULES:
1. Keep the same structure (headline, subheadline, CTA, same number of sections)
2. Align all copy with the ad's tone and promise
3. Be concise, specific, and conversion-focused
4. Do NOT use generic placeholders

Respond with a JSON object:
{
  "headline": "new headline",
  "subheadline": "new subheadline",
  "cta": "new CTA text",
  "section_improvements": [
    { "original": "original text", "improved": "improved text", "explanation": "why" }
  ],
  "reasoning": ["bullet point 1", "bullet point 2", "bullet point 3"]
}`;

  const result = await completionWithValidation({
    prompt,
    schema: CopyOutputSchema,
  });

  if (result.success) return result.data;

  console.warn('Copy generation fallback:', result.error);
  const adWords = adAnalysis.promise.split(' ').slice(0, 6).join(' ');
  return {
    headline: `Transform Faster: ${adWords}`,
    subheadline: 'Discover how our targeted approach delivers the exact results you\'re looking for.',
    cta: 'Get Started Now',
    section_improvements: scrapedPage.sections.map((s) => ({
      original: s,
      improved: `We adapt our core strategies to support: ${adWords}. Experience accelerated progress.`,
      explanation: 'Replaced generic description with ad-aligned messaging.',
    })),
    reasoning: [
      'Aligned headline with ad promise to reduce bounce rate.',
      'Adjusted subheadline to validate user intent.',
      'Modified sections to carry the ad narrative through the page.',
    ],
  };
}

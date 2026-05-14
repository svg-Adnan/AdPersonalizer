import { completionWithValidation, visionCompletion } from '../client.js';
import { LandingAnalysisSchema } from '../schemas.js';
import type { ScrapedPage, LandingAnalysis } from '../../../types.js';

export async function analyzeLandingPage(
  scrapedPage: ScrapedPage
): Promise<LandingAnalysis> {
  // Run vision analysis on screenshot if available
  let visualContext = '';
  if (scrapedPage.screenshotBase64) {
    console.log('  📸 Running vision analysis on landing page screenshot...');
    visualContext = await visionCompletion(
      'Analyze this landing page screenshot. Describe: the visual design quality, color scheme, layout structure, typography, visual hierarchy, call-to-action placement, and overall user experience. Identify any design weaknesses or conversion barriers.',
      scrapedPage.screenshotBase64
    );
  }

  const prompt = `You are a landing page conversion expert. Analyze the following landing page content and provide structured insights.

LANDING PAGE CONTENT:
- Headline: "${scrapedPage.headline}"
- Subheadline: "${scrapedPage.subheadline}"
- CTA: "${scrapedPage.cta}"
- Sections: ${JSON.stringify(scrapedPage.sections)}

${visualContext ? `VISUAL ANALYSIS FROM SCREENSHOT:\n${visualContext}\n` : ''}

Respond with a JSON object containing:
- "content_quality": overall assessment of the content quality
- "relevance_score": 0-10 score of how relevant/compelling the content is
- "strengths": array of content/design strengths
- "weaknesses": array of content/design weaknesses and conversion barriers
- "visual_observations": summary of visual/design observations (from screenshot if available)

Respond ONLY with valid JSON.`;

  const result = await completionWithValidation({
    prompt,
    schema: LandingAnalysisSchema,
  });

  if (result.success) return result.data;

  console.warn('Landing analysis fallback:', result.error);
  return {
    content_quality: 'Standard landing page with room for improvement',
    relevance_score: 5,
    strengths: ['Has clear headline', 'CTA is present'],
    weaknesses: ['Generic messaging', 'Could be more targeted'],
    visual_observations: visualContext || undefined,
  };
}

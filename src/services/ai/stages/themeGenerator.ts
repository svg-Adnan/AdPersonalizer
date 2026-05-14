import { completionWithValidation } from '../client.js';
import { ThemeOutputSchema } from '../schemas.js';
import type { AdAnalysis, CopyOutput, ThemeOutput } from '../../../types.js';

export async function generateTheme(
  adAnalysis: AdAnalysis,
  copy: CopyOutput
): Promise<ThemeOutput> {
  const prompt = `You are a UI/UX designer. Generate a visual theme for a web application that matches the ad creative's brand feel.

AD INSIGHTS:
- Audience: ${adAnalysis.audience}
- Tone: ${adAnalysis.tone}
- Urgency: ${adAnalysis.urgency_level}

GENERATED COPY CONTEXT:
- Headline: "${copy.headline}"
- CTA: "${copy.cta}"

RULES:
1. Colors must feel premium and match the ad's emotional tone
2. Pick fontFamily from EXACTLY one of: "Inter", "Montserrat", "Playfair Display", "Roboto Mono"
3. All colors must be valid hex (#RRGGBB) except cardBg which should be RGBA
4. The theme should enhance readability against a dark background

Respond with a JSON object:
{
  "primaryColor": "#hex",
  "secondaryColor": "#hex",
  "backgroundColor": "#hex",
  "cardBg": "rgba(r, g, b, a)",
  "fontFamily": "Inter | Montserrat | Playfair Display | Roboto Mono"
}`;

  const result = await completionWithValidation({
    prompt,
    schema: ThemeOutputSchema,
  });

  if (result.success) return result.data;

  console.warn('Theme generation fallback:', result.error);
  return {
    primaryColor: '#6366f1',
    secondaryColor: '#a855f7',
    backgroundColor: '#0f172a',
    cardBg: 'rgba(30, 41, 59, 0.7)',
    fontFamily: 'Inter',
  };
}

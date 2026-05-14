import Groq from 'groq-sdk';
import { z } from 'zod';
import { getConfig } from '../../config.js';

let groqClient: Groq | null = null;

export function getGroqClient(): Groq | null {
  if (groqClient) return groqClient;
  const config = getConfig();
  if (!config.GROQ_API_KEY) return null;
  groqClient = new Groq({ apiKey: config.GROQ_API_KEY });
  return groqClient;
}

// ─── JSON Extraction Helpers ────────────────────────────────────
function extractJsonFromText(text: string): string {
  // Try to find JSON in markdown code fences
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) return fenceMatch[1].trim();

  // Try to find JSON object directly
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) return objectMatch[0];

  return text;
}

// ─── Core completion with retry + Zod validation ────────────────
export interface CompletionOptions<T> {
  prompt: string;
  schema: z.ZodSchema<T>;
  model?: string;
  maxRetries?: number;
  temperature?: number;
}

export async function completionWithValidation<T>(
  options: CompletionOptions<T>
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  const {
    prompt,
    schema,
    model = 'llama-3.3-70b-versatile',
    maxRetries = 3,
    temperature = 0.7,
  } = options;

  const client = getGroqClient();
  if (!client) {
    return { success: false, error: 'Groq client not available (no API key)' };
  }

  let lastError = '';
  let currentPrompt = prompt;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const backoffMs = Math.pow(2, attempt - 1) * 1000;
      if (attempt > 1) {
        console.log(`  Retry ${attempt}/${maxRetries} after ${backoffMs}ms...`);
        await sleep(backoffMs);
      }

      const completion = await client.chat.completions.create({
        messages: [{ role: 'user', content: currentPrompt }],
        model,
        response_format: { type: 'json_object' },
        temperature,
      });

      const raw = completion.choices[0]?.message?.content;
      if (!raw) {
        lastError = 'Empty response from AI';
        continue;
      }

      // Try to parse JSON
      const jsonStr = extractJsonFromText(raw);
      let parsed: unknown;
      try {
        parsed = JSON.parse(jsonStr);
      } catch {
        lastError = `JSON parse error: ${jsonStr.substring(0, 200)}`;
        // Append error feedback for next retry
        currentPrompt = `${prompt}\n\nIMPORTANT: Your previous response was not valid JSON. Please respond with ONLY a valid JSON object, no extra text.`;
        continue;
      }

      // Validate with Zod
      const result = schema.safeParse(parsed);
      if (result.success) {
        return { success: true, data: result.data };
      }

      // Build detailed error feedback
      const issues = result.error.issues
        .map((i) => `- ${i.path.join('.')}: ${i.message}`)
        .join('\n');
      lastError = `Zod validation failed:\n${issues}`;

      // Retry with error feedback
      currentPrompt = `${prompt}\n\nIMPORTANT: Your previous response had these validation errors:\n${issues}\nPlease fix these issues and respond with a valid JSON object.`;
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      lastError = `API error: ${errMsg}`;

      // Check for rate limiting
      if (errMsg.includes('rate_limit') || errMsg.includes('429')) {
        console.warn('  Rate limited by Groq, backing off...');
        await sleep(5000);
      }
    }
  }

  return { success: false, error: `All ${maxRetries} attempts failed. Last error: ${lastError}` };
}

// ─── Vision Completion ──────────────────────────────────────────
export async function visionCompletion(
  prompt: string,
  imageBase64: string,
  model = 'meta-llama/llama-4-scout-17b-16e-instruct'
): Promise<string> {
  const client = getGroqClient();
  if (!client) return 'Vision analysis unavailable (no API key)';

  try {
    const completion = await client.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: imageBase64 } },
          ],
        },
      ],
      model,
    });

    return completion.choices[0]?.message?.content || 'No vision response';
  } catch (error) {
    console.error('Vision API error:', error);
    return 'Vision analysis failed';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

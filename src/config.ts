import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is required'),
  PORT: z.coerce.number().default(3002),
  RATE_LIMIT_MAX: z.coerce.number().default(10),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60_000),
  CACHE_TTL_MS: z.coerce.number().default(30 * 60 * 1000), // 30 min
  CACHE_MAX_ENTRIES: z.coerce.number().default(100),
  DB_PATH: z.string().default('./data/history.db'),
  SCREENSHOT_DIR: z.string().default('./data/screenshots'),
  NODE_ENV: z.enum(['development', 'production']).default('development'),
});

export type AppConfig = z.infer<typeof envSchema>;

let _config: AppConfig | null = null;

export function loadConfig(): AppConfig {
  if (_config) return _config;

  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error('❌ Invalid environment configuration:');
    for (const issue of result.error.issues) {
      console.error(`   ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }

  _config = result.data;
  return _config;
}

export function getConfig(): AppConfig {
  if (!_config) return loadConfig();
  return _config;
}

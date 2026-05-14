import rateLimit from 'express-rate-limit';
import { getConfig } from '../config.js';

export function createRateLimiter() {
  const config = getConfig();

  return rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'Too many requests. Please try again later.',
      code: 'RATE_LIMITED',
    },
    keyGenerator: (req) => {
      // Use X-Forwarded-For if behind a proxy, otherwise use IP
      return (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
        || req.ip
        || 'unknown';
    },
  });
}

import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import sanitizeHtml from 'sanitize-html';

// ─── Helmet (HTTP security headers) ────────────────────────────
export const securityHeaders = helmet({
  contentSecurityPolicy: false, // We serve inline styles for theming
  crossOriginEmbedderPolicy: false,
});

// ─── URL Validation ─────────────────────────────────────────────
const BLOCKED_HOSTS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^0\./,
  /^\[::1\]$/,
  /^169\.254\./,  // Link-local
];

const ALLOWED_PROTOCOLS = ['http:', 'https:'];

export function validateUrl(url: string): { valid: boolean; error?: string } {
  try {
    const parsed = new URL(url);

    if (!ALLOWED_PROTOCOLS.includes(parsed.protocol)) {
      return { valid: false, error: `Protocol "${parsed.protocol}" is not allowed. Use http: or https:` };
    }

    const hostname = parsed.hostname;
    for (const pattern of BLOCKED_HOSTS) {
      if (pattern.test(hostname)) {
        return { valid: false, error: `Host "${hostname}" is blocked (private/internal address)` };
      }
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

// ─── Input Sanitization ────────────────────────────────────────
export function sanitizeInput(text: string): string {
  // Strip all HTML tags
  const cleaned = sanitizeHtml(text, {
    allowedTags: [],
    allowedAttributes: {},
  });
  // Limit length
  return cleaned.slice(0, 5000);
}

// ─── Prompt Injection Mitigation ────────────────────────────────
export function wrapUserContent(content: string): string {
  // Wrap user content in delimiters so the AI model can distinguish it
  return `<user_input>\n${content}\n</user_input>`;
}

// ─── Request Sanitization Middleware ────────────────────────────
export function sanitizeRequestBody(req: Request, _res: Response, next: NextFunction): void {
  if (req.body && typeof req.body === 'object') {
    if (typeof req.body.adCreative === 'string') {
      req.body.adCreative = sanitizeInput(req.body.adCreative);
    }
    if (typeof req.body.url === 'string') {
      req.body.url = req.body.url.trim();
    }
  }
  next();
}

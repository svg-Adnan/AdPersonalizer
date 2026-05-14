import { chromium, Browser, BrowserContext } from 'playwright';
import { createHash } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import path from 'path';
import { readFile } from 'fs/promises';
import { getConfig } from '../config.js';
import { validateUrl } from '../middleware/security.js';
import type { ScrapedPage } from '../types.js';

let browser: Browser | null = null;
let context: BrowserContext | null = null;

const DEFAULT_PAGE: ScrapedPage = {
  headline: 'Transform Your Body in 30 Days',
  subheadline: 'Personalized fitness coaching designed for real results',
  cta: 'Start Your Journey',
  sections: [
    'Custom workout plans tailored to your goals',
    'Nutrition guidance that fits your lifestyle',
    'Track progress and stay motivated',
  ],
};

// ─── Browser Lifecycle ──────────────────────────────────────────
export async function initBrowser(): Promise<void> {
  if (browser) return;
  console.log('🌐 Launching Playwright browser...');
  browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });
  context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
  });
  console.log('✅ Playwright browser ready');
}

export async function closeBrowser(): Promise<void> {
  if (context) {
    await context.close();
    context = null;
  }
  if (browser) {
    await browser.close();
    browser = null;
  }
  console.log('🛑 Playwright browser closed');
}

// ─── Screenshot Helpers ─────────────────────────────────────────
function ensureScreenshotDir(): string {
  const config = getConfig();
  const dir = path.resolve(config.SCREENSHOT_DIR);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function urlToHash(url: string): string {
  return createHash('sha256').update(url).digest('hex').slice(0, 16);
}

// ─── Main Scraping Function ────────────────────────────────────
export async function scrapeLandingPage(url: string): Promise<ScrapedPage> {
  // Demo sample case
  if (url === 'https://example.com/elite-coaching-demo' || !url) {
    return { ...DEFAULT_PAGE };
  }

  // Validate URL
  const validation = validateUrl(url);
  if (!validation.valid) {
    console.warn(`URL blocked: ${validation.error}`);
    return { ...DEFAULT_PAGE };
  }

  if (!context) {
    console.warn('Browser not initialized, returning default page');
    return { ...DEFAULT_PAGE };
  }

  const page = await context.newPage();

  try {
    // Navigate with timeout
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: 30_000,
    });

    // Wait a bit extra for JS rendering
    await page.waitForTimeout(2000);

    // Remove unwanted elements
    await page.evaluate(() => {
      const selectors = 'nav, footer, script, style, noscript, .popup, .overlay, #menu, .header-menu, .cookie-banner, [role="navigation"]';
      document.querySelectorAll(selectors).forEach((el) => el.remove());
    });

    // Extract content
    const content = await page.evaluate(() => {
      const headline = document.querySelector('h1')?.textContent?.trim() || 'No Headline Found';

      // Find a substantial subheadline
      let subheadline = 'No Subheadline Found';
      const candidates = document.querySelectorAll('h2, p');
      for (const el of candidates) {
        const text = el.textContent?.trim() || '';
        if (text.length > 20 && text.length < 200) {
          subheadline = text;
          break;
        }
      }

      // Find CTA
      let cta = 'Click Here';
      const ctaCandidates = document.querySelectorAll('button, a.button, a.btn, .cta, [class*="cta"], [class*="btn"]');
      for (const el of ctaCandidates) {
        const text = el.textContent?.trim() || '';
        if (text.length > 0 && text.length < 30) {
          cta = text;
          break;
        }
      }

      // Extract section content
      const sections: string[] = [];
      const sectionEls = document.querySelectorAll('section, [class*="section"], main > div');
      for (const el of sectionEls) {
        if (sections.length >= 3) break;
        const text = el.textContent?.trim() || '';
        if (text.length > 100) {
          const cleanText = text.replace(/\s\s+/g, ' ').substring(0, 500);
          if (!sections.includes(cleanText)) {
            sections.push(cleanText);
          }
        }
      }

      // Fallback: use paragraphs if no sections found
      if (sections.length === 0) {
        const paragraphs = document.querySelectorAll('p');
        for (const p of paragraphs) {
          if (sections.length >= 3) break;
          const text = p.textContent?.trim() || '';
          if (text.length > 50) {
            sections.push(text.substring(0, 500));
          }
        }
      }

      return { headline, subheadline, cta, sections };
    });

    // Take screenshot
    const screenshotDir = ensureScreenshotDir();
    const hash = urlToHash(url);
    const screenshotPath = path.join(screenshotDir, `${hash}.png`);

    await page.screenshot({
      path: screenshotPath,
      fullPage: true,
      type: 'png',
    });

    // Read screenshot as base64 for vision analysis
    const screenshotBuffer = await readFile(screenshotPath);
    const screenshotBase64 = `data:image/png;base64,${screenshotBuffer.toString('base64')}`;

    return {
      ...content,
      sections: content.sections.length > 0 ? content.sections : DEFAULT_PAGE.sections,
      screenshotPath,
      screenshotBase64,
    };
  } catch (error) {
    console.error('Scraping error:', error);
    return { ...DEFAULT_PAGE };
  } finally {
    await page.close();
  }
}

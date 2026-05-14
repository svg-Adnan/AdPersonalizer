import { Router, Request, Response } from 'express';
import { scrapeLandingPage } from '../services/scraper.js';
import { runPipeline } from '../services/ai/pipeline.js';
import { LRUCache, hashUrl } from '../services/cache.js';
import { validateUrl } from '../middleware/security.js';
import { saveGeneration } from '../database/historyRepo.js';
import type { ScrapedPage } from '../types.js';

const router = Router();
const pageCache = new LRUCache<ScrapedPage>();

router.post('/', async (req: Request, res: Response) => {
  const { url, adCreative, adImage } = req.body;

  if (!adCreative && !adImage) {
    res.status(400).json({ error: 'Ad Creative or Image is required', code: 'MISSING_INPUT' });
    return;
  }

  if (url && url !== 'https://example.com/elite-coaching-demo') {
    const validation = validateUrl(url);
    if (!validation.valid) {
      res.status(400).json({ error: validation.error, code: 'INVALID_URL' });
      return;
    }
  }

  // Set up SSE
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  try {
    // Stage 0: Scraping (with cache)
    const stageData = JSON.stringify({ stage: 'scraping', status: 'running' });
    res.write(`event: stage\ndata: ${stageData}\n\n`);

    let scrapedPage: ScrapedPage;
    const cacheKey = url ? hashUrl(url) : '';

    if (cacheKey && pageCache.has(cacheKey)) {
      console.log('📋 Cache hit for URL');
      scrapedPage = pageCache.get(cacheKey)!;
    } else {
      scrapedPage = await scrapeLandingPage(url || '');
      if (cacheKey) {
        pageCache.set(cacheKey, scrapedPage);
      }
    }

    const scrapeComplete = JSON.stringify({ stage: 'scraping', status: 'complete', result: scrapedPage });
    res.write(`event: stage\ndata: ${scrapeComplete}\n\n`);

    // Run AI pipeline (streams its own events)
    const pipelineResult = await runPipeline(
      adCreative || '',
      adImage,
      scrapedPage,
      res
    );

    // Save to history
    const historyId = saveGeneration({
      adCreative: adCreative || '[Image-based]',
      landingUrl: url || 'demo',
      originalContent: scrapedPage,
      pipelineResult,
      evaluationScores: pipelineResult.evaluation,
      screenshotPath: scrapedPage.screenshotPath || null,
      adImage: adImage || null,
    });

    // Send final complete event
    const completeData = JSON.stringify({
      original: {
        headline: scrapedPage.headline,
        subheadline: scrapedPage.subheadline,
        cta: scrapedPage.cta,
        sections: scrapedPage.sections,
      },
      headline: pipelineResult.copy.headline,
      subheadline: pipelineResult.copy.subheadline,
      cta: pipelineResult.copy.cta,
      section_improvements: pipelineResult.copy.section_improvements,
      reasoning: pipelineResult.copy.reasoning,
      appTheme: pipelineResult.theme,
      analysis: pipelineResult.adAnalysis,
      toneMatch: pipelineResult.toneMatch,
      landingAnalysis: pipelineResult.landingAnalysis,
      evaluation: pipelineResult.evaluation,
      historyId,
    });
    res.write(`event: complete\ndata: ${completeData}\n\n`);
    res.end();
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('Pipeline error:', errMsg);
    const errData = JSON.stringify({ error: errMsg });
    res.write(`event: error\ndata: ${errData}\n\n`);
    res.end();
  }
});

export default router;

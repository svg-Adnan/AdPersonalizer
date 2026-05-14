import { Router, Request, Response } from 'express';
import { getGenerationById } from '../database/historyRepo.js';

const router = Router();

router.get('/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const record = getGenerationById(id);

  if (!record) {
    res.status(404).send('<h1>Page not found</h1>');
    return;
  }

  const pipeline = JSON.parse(record.pipeline_result);
  const theme = pipeline.theme;
  const copy = pipeline.copy;
  const adAnalysis = pipeline.adAnalysis;
  const adImage = record.ad_image;

  const fontFamily = theme.fontFamily || 'Inter';
  const primaryColor = theme.primaryColor || '#6366f1';
  const secondaryColor = theme.secondaryColor || '#a855f7';
  const backgroundColor = theme.backgroundColor || '#0f172a';
  const cardBg = theme.cardBg || 'rgba(30, 41, 59, 0.7)';

  // Hero background: use ad image with overlay if available, else subtle gradient
  const heroBackground = adImage
    ? `background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url('${adImage}'); background-size: cover; background-position: center;`
    : `background: linear-gradient(160deg, ${backgroundColor} 0%, ${primaryColor}22 50%, ${secondaryColor}22 100%);`;

  const heroOverlay = adImage
    ? `background: rgba(0,0,0,0.15); backdrop-filter: blur(2px);`
    : `background:
        radial-gradient(ellipse 600px 400px at 20% 30%, ${primaryColor}18, transparent),
        radial-gradient(ellipse 500px 350px at 80% 70%, ${secondaryColor}15, transparent);`;

  const sectionsHTML = copy.section_improvements
    .map((s: { improved: string }, i: number) => `
      <div class="section">
        <div class="section-icon" style="background: ${primaryColor}18; color: ${primaryColor};">
          ${['\u2726', '\u25C6', '\u2605', '\u25CF', '\u25B2'][i % 5]}
        </div>
        <p>${s.improved}</p>
      </div>
    `)
    .join('');

  const benefitsHTML = (adAnalysis.benefits || [])
    .map((b: string) => `<li>${b}</li>`)
    .join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${copy.headline} | Personalized Landing Page</title>
  <meta name="description" content="${copy.subheadline}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&family=Montserrat:wght@400;700;800&family=Playfair+Display:wght@700;800&family=Roboto+Mono:wght@400;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: '${fontFamily}', system-ui, sans-serif;
      background: ${backgroundColor};
      color: #f1f5f9;
      line-height: 1.7;
      overflow-x: hidden;
    }

    .hero {
      min-height: 80vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 4rem 2rem;
      position: relative;
      ${heroBackground}
    }

    .hero::before {
      content: '';
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      ${heroOverlay}
      pointer-events: none;
    }

    .hero-content { position: relative; max-width: 800px; z-index: 1; }

    .badge {
      display: inline-block;
      background: ${adImage ? 'rgba(0,0,0,0.5)' : `${primaryColor}22`};
      color: ${adImage ? '#ffffff' : primaryColor};
      font-weight: 700;
      font-size: 0.8rem;
      padding: 0.4rem 1.2rem;
      border-radius: 999px;
      border: 1px solid ${adImage ? 'rgba(255,255,255,0.25)' : `${primaryColor}44`};
      margin-bottom: 2rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      ${adImage ? 'backdrop-filter: blur(10px);' : ''}
    }

    h1 {
      font-size: clamp(2.4rem, 5vw, 4rem);
      font-weight: 800;
      line-height: 1.15;
      margin-bottom: 1.5rem;
      letter-spacing: -0.02em;
      ${adImage
        ? `color: #ffffff; text-shadow: 0 3px 20px rgba(0,0,0,0.6);`
        : `background: linear-gradient(135deg, #ffffff, ${primaryColor}); -webkit-background-clip: text; -webkit-text-fill-color: transparent;`
      }
    }

    .subheadline {
      font-size: 1.25rem;
      color: ${adImage ? '#e2e8f0' : '#94a3b8'};
      max-width: 600px;
      margin: 0 auto 2.5rem;
      ${adImage ? 'text-shadow: 0 2px 10px rgba(0,0,0,0.5);' : ''}
    }

    .cta-btn {
      display: inline-block;
      background: linear-gradient(135deg, ${primaryColor}, ${secondaryColor});
      color: #fff;
      font-weight: 700;
      font-size: 1.15rem;
      padding: 1rem 2.5rem;
      border: none;
      border-radius: 999px;
      cursor: pointer;
      text-decoration: none;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 8px 30px ${primaryColor}44;
    }
    .cta-btn:hover { transform: translateY(-3px); box-shadow: 0 14px 40px ${primaryColor}55; }

    .sections {
      max-width: 900px;
      margin: 0 auto;
      padding: 5rem 2rem;
      display: grid;
      gap: 2rem;
    }

    .section {
      background: ${cardBg};
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 1.25rem;
      padding: 2rem;
      transition: transform 0.25s, box-shadow 0.25s;
    }
    .section:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(0,0,0,0.3);
    }

    .section-icon {
      width: 44px; height: 44px;
      border-radius: 12px;
      display: flex; align-items: center; justify-content: center;
      font-size: 1.2rem;
      margin-bottom: 1rem;
      font-weight: 700;
    }

    .section p { color: #cbd5e1; font-size: 1.05rem; }

    .benefits {
      max-width: 900px;
      margin: 0 auto;
      padding: 0 2rem 5rem;
    }
    .benefits h2 {
      text-align: center;
      font-size: 1.8rem;
      margin-bottom: 2rem;
      color: #e2e8f0;
    }
    .benefits ul {
      list-style: none;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 1rem;
    }
    .benefits li {
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 0.75rem;
      padding: 1rem 1.25rem;
      color: #94a3b8;
      font-size: 0.95rem;
    }
    .benefits li::before {
      content: '\\2713  ';
      color: ${primaryColor};
      font-weight: 700;
    }

    .page-footer {
      text-align: center;
      padding: 3rem 2rem 4rem;
      border-top: 1px solid rgba(255,255,255,0.06);
    }
    .page-footer p { color: #475569; font-size: 0.85rem; }
    .page-footer a { color: ${primaryColor}; text-decoration: none; }
    .powered-by { margin-top: 0.5rem; font-size: 0.75rem; color: #334155; }
  </style>
</head>
<body>
  <section class="hero">
    <div class="hero-content">
      <div class="badge">${adAnalysis.tone || 'Personalized for You'}</div>
      <h1>${copy.headline}</h1>
      <p class="subheadline">${copy.subheadline}</p>
      <a href="#sections" class="cta-btn">${copy.cta}</a>
    </div>
  </section>

  <div id="sections" class="sections">
    ${sectionsHTML}
  </div>

  ${benefitsHTML ? `
  <div class="benefits">
    <h2>What You Get</h2>
    <ul>${benefitsHTML}</ul>
  </div>` : ''}

  <footer class="page-footer">
    <p>Generated by <a href="/">AdPersonalizer</a></p>
    <p class="powered-by">AI-personalized landing page &middot; ID: ${id.slice(0, 8)}</p>
  </footer>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

export default router;

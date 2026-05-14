import { Router, Request, Response } from 'express';
import { getGenerations, getGenerationById, deleteGeneration } from '../database/historyRepo.js';

const router = Router();

// List generations (paginated)
router.get('/', (req: Request, res: Response) => {
  const limitParam = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
  const offsetParam = Array.isArray(req.query.offset) ? req.query.offset[0] : req.query.offset;
  const limit = Math.min(parseInt(String(limitParam || '20')) || 20, 100);
  const offset = parseInt(String(offsetParam || '0')) || 0;

  const generations = getGenerations(limit, offset);

  // Parse JSON fields for response
  const results = generations.map((g) => ({
    id: g.id,
    ad_creative: g.ad_creative,
    landing_url: g.landing_url,
    created_at: g.created_at,
    evaluation_scores: JSON.parse(g.evaluation_scores),
  }));

  res.json({ results, limit, offset });
});

// Get single generation
router.get('/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const record = getGenerationById(id);
  if (!record) {
    res.status(404).json({ error: 'Generation not found', code: 'NOT_FOUND' });
    return;
  }

  res.json({
    ...record,
    original_content: JSON.parse(record.original_content),
    pipeline_result: JSON.parse(record.pipeline_result),
    evaluation_scores: JSON.parse(record.evaluation_scores),
  });
});

// Delete generation
router.delete('/:id', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const deleted = deleteGeneration(id);
  if (!deleted) {
    res.status(404).json({ error: 'Generation not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ success: true });
});

export default router;

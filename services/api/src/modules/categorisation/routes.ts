// ═══════════════════════════════════════════════════════════════════
// Categorisation Module — Manual override + AI status endpoints
// ═══════════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../../db/supabase-client';
import { categorizeComplaint } from '../../ai/auto-categorisation';
import { requireRole } from '../../gateway/auth-middleware';
import { OfficerRole, ComplaintCategory } from '../../types';
import { isFeatureEnabled } from '../../config';

const ManualCategorizeSchema = z.object({
  category: z.nativeEnum(ComplaintCategory),
  subcategory: z.string().optional(),
  department_ownership: z.array(z.string()).optional(),
});

async function reCategorize(req: Request, res: Response) {
  const { id } = req.params;

  const { data: complaint } = await supabaseAdmin.from('complaints')
    .select('description, photos').eq('id', id).single();
  if (!complaint) { res.status(404).json({ error: 'NOT_FOUND', status: 404 }); return; }

  if (!isFeatureEnabled('ai_categorization')) {
    res.status(400).json({ error: 'FEATURE_DISABLED', message: 'AI categorization is not enabled for current phase', status: 400 }); return;
  }

  const result = await categorizeComplaint(complaint.description, null);

  await supabaseAdmin.from('complaints').update({
    category: result.category,
    subcategory: result.subcategory,
    department_ownership: result.department_ownership,
    ai_confidence: result.ai_confidence,
    ai_categorization_status: result.ai_confidence >= 0.7 ? 'AI_CONFIRMED' : 'LOW_CONFIDENCE',
    is_multi_owner: result.department_ownership.length > 1,
    updated_at: new Date().toISOString(),
  }).eq('id', id);

  await supabaseAdmin.from('action_logs').insert({
    complaint_id: id, officer_id: req.user!.officer_id,
    action_type: 'AI_RECATEGORIZATION',
    metadata: result,
  });

  res.json({ complaint_id: id, categorization: result });
}

async function manualCategorize(req: Request, res: Response) {
  const { id } = req.params;
  const dto = ManualCategorizeSchema.parse(req.body);

  await supabaseAdmin.from('complaints').update({
    category: dto.category,
    subcategory: dto.subcategory,
    department_ownership: dto.department_ownership || [dto.category],
    ai_categorization_status: 'MANUAL_OVERRIDE',
    is_multi_owner: (dto.department_ownership || []).length > 1,
    updated_at: new Date().toISOString(),
  }).eq('id', id);

  await supabaseAdmin.from('action_logs').insert({
    complaint_id: id, officer_id: req.user!.officer_id,
    action_type: 'MANUAL_CATEGORIZATION',
    metadata: dto,
  });

  res.json({ message: 'Category updated', complaint_id: id });
}

export const categorisationRouter = Router();
categorisationRouter.post('/:id/ai-categorize', requireRole(OfficerRole.OFFICER, OfficerRole.SUPERVISOR, OfficerRole.ADMIN), reCategorize);
categorisationRouter.post('/:id/manual-categorize', requireRole(OfficerRole.OFFICER, OfficerRole.SUPERVISOR), manualCategorize);


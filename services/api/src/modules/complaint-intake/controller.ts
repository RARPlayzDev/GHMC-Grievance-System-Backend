// ═══════════════════════════════════════════════════════════════════
// Complaint Intake — Controller (input validation + request handling)
// ═══════════════════════════════════════════════════════════════════

import { Request, Response } from 'express';
import { z } from 'zod';
import { ComplaintCategory, SourceChannel } from '../../types';
import * as service from './service';
import { getComplaintById } from './repository';
import { criticalEvents } from '../../lib/logger';
import { storage } from '../../storage/supabase-storage';

const CreateComplaintSchema = z.object({
  filed_location: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  category: z.nativeEnum(ComplaintCategory),
  subcategory: z.string().optional(),
  description: z.string().max(1000).optional(),
  source_channel: z.nativeEnum(SourceChannel).optional(),
  device_fingerprint: z.string().optional(),
});

const SyncSchema = z.object({
  complaints: z.array(CreateComplaintSchema),
  device_id: z.string(),
});

export async function createComplaint(req: Request, res: Response): Promise<void> {
  try {
    // Parse body — handles both JSON and multipart/form-data
    let body = req.body;
    if (typeof body.filed_location === 'string') {
      body.filed_location = JSON.parse(body.filed_location);
    }
    const dto = CreateComplaintSchema.parse(body);

    // Extract photo buffers from multer
    const files = (req.files as Express.Multer.File[]) || [];
    const photoBuffers = files.map((f) => f.buffer);

    const complaint = await service.createComplaint(dto, photoBuffers);

    // Generate signed URLs for photos in response
    const photosWithUrls = await Promise.all(
      (complaint.photos || []).map((p) => storage.generateSignedUrl(p, 86400))
    );

    res.status(201).json({ ...complaint, photos: photosWithUrls });
  } catch (err: any) {
    criticalEvents.complaintIntakeFailed(err, { body: req.body });
    throw err;
  }
}

export async function getComplaint(req: Request, res: Response): Promise<void> {
  const complaint = await getComplaintById(req.params.id);
  if (!complaint) {
    res.status(404).json({ error: 'NOT_FOUND', message: 'Complaint not found', status: 404 });
    return;
  }

  // Generate signed URLs for photos
  const photosWithUrls = await Promise.all(
    (complaint.photos || []).map((p) => storage.generateSignedUrl(p, 86400).catch(() => p))
  );

  res.json({ ...complaint, photos: photosWithUrls });
}

export async function syncComplaints(req: Request, res: Response): Promise<void> {
  const { complaints, device_id } = SyncSchema.parse(req.body);
  const result = await service.syncOfflineComplaints(complaints, device_id);
  res.json(result);
}


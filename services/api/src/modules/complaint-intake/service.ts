// ═══════════════════════════════════════════════════════════════════
// Complaint Intake — Service (business logic, pure functions)
// ═══════════════════════════════════════════════════════════════════

import { v4 as uuidv4 } from 'uuid';
import ngeohash from 'ngeohash';
import crypto from 'crypto';
import { CreateComplaintDTO, ComplaintStatus, SourceChannel, Complaint } from '../../types';
import * as repo from './repository';
import { resolveWard } from '../../ai/ward-routing-nlp';
import { categorizeComplaint } from '../../ai/auto-categorisation';
import { isFeatureEnabled } from '../../config';
import { storage } from '../../storage/supabase-storage';
import { queue, QUEUE_NAMES } from '../../queue/memory-queue';
import { logger } from '../../lib/logger';

/**
 * Process a new complaint: hash fingerprint, compute geohash,
 * check for bundle candidates, route to ward, optionally AI-categorize.
 */
export async function createComplaint(
  dto: CreateComplaintDTO,
  photoBuffers: Buffer[],
): Promise<Complaint> {
  // 1. Hash device fingerprint (SHA-256 before storing — PDPB compliance)
  const fingerprintHash = dto.device_fingerprint
    ? crypto.createHash('sha256').update(dto.device_fingerprint).digest('hex')
    : null;

  // 2. Compute geohash from location
  const geohash = ngeohash.encode(dto.filed_location.lat, dto.filed_location.lng, 7);

  // 3. Upload photos
  const photoUrls: string[] = [];
  for (const buf of photoBuffers) {
    const path = await storage.uploadPhoto(buf, 'image/webp');
    photoUrls.push(path);
  }

  // 4. Ward routing (three-signal)
  const routing = await resolveWard(dto.filed_location, dto.description || null);

  // 5. AI categorization (Phase 2+)
  let aiCategory = null;
  let aiConfidence = null;
  let aiStatus = null;
  let deptOwnership: string[] = [dto.category];

  if (isFeatureEnabled('ai_categorization') && (dto.description || photoBuffers.length > 0)) {
    try {
      const photoBase64 = photoBuffers.length > 0 ? photoBuffers[0].toString('base64') : null;
      aiCategory = await categorizeComplaint(dto.description || null, photoBase64);
      aiConfidence = aiCategory.ai_confidence;
      aiStatus = aiConfidence >= 0.7 ? 'AI_CONFIRMED' : 'FALLBACK_MANUAL_REQUIRED';
      deptOwnership = aiCategory.department_ownership;
    } catch (err) {
      aiStatus = 'AI_UNAVAILABLE';
      logger.warn('AI categorization failed, falling back to manual', { error: (err as Error).message });
    }
  }

  // 6. Check for bundle candidates (geohash-7 + same category + 24hr window)
  const candidates = await repo.findBundleCandidates(geohash, aiCategory?.category || dto.category);
  let bundleId: string | null = null;
  let bundleCount = 1;

  if (candidates.length > 0) {
    const primary = candidates[0];
    if (primary.bundle_id) {
      bundleId = primary.bundle_id;
      bundleCount = primary.bundle_count + 1;
      // Update primary's bundle count
      await repo.updateComplaint(primary.id, { bundle_count: bundleCount });
    } else {
      // Create new bundle
      const bundle = await repo.insertBundle({
        primary_complaint_id: primary.id,
        bundled_complaint_ids: [primary.id],
        geohash,
        category: aiCategory?.category || dto.category,
        bundle_count: candidates.length + 1,
        filed_location: dto.filed_location as any,
      });
      bundleId = bundle.id;
      bundleCount = candidates.length + 1;
      await repo.updateComplaint(primary.id, { bundle_id: bundle.id, bundle_count: bundleCount });
    }
  }

  // 7. Insert complaint
  const complaint = await repo.insertComplaint({
    filed_location: dto.filed_location as any,
    geohash,
    category: aiCategory?.category || dto.category,
    subcategory: aiCategory?.subcategory || dto.subcategory || null,
    description: dto.description || null,
    photos: photoUrls,
    source_channel: dto.source_channel || SourceChannel.PWA,
    device_fingerprint_hash: fingerprintHash,
    ward_id: routing.ward_id,
    routing_confidence_score: routing.confidence,
    routing_method: routing.method as any,
    department_ownership: deptOwnership,
    is_multi_owner: deptOwnership.length > 1,
    ai_confidence: aiConfidence,
    ai_categorization_status: aiStatus,
    bundle_id: bundleId,
    bundle_count: bundleCount,
    status: routing.ward_id ? ComplaintStatus.ROUTED : ComplaintStatus.NEW,
  });

  // 8. Log action
  await repo.insertActionLog({
    complaint_id: complaint.id,
    action_type: 'COMPLAINT_FILED',
    metadata: { source_channel: dto.source_channel, routing_method: routing.method, routing_confidence: routing.confidence },
  });

  // 9. Dispatch async jobs
  if (complaint.is_multi_owner) {
    await queue.addJob('multi-owner-setup', { complaint_id: complaint.id, departments: deptOwnership });
  }

  await queue.addJob(QUEUE_NAMES.NOTIFICATION, {
    complaint_id: complaint.id,
    type: 'COMPLAINT_FILED',
    status: complaint.status,
  });

  return complaint;
}

/**
 * Sync offline complaints — deduplicate by geohash + category + 1hr window.
 */
export async function syncOfflineComplaints(complaints: CreateComplaintDTO[], deviceId: string) {
  let synced = 0;
  let duplicates = 0;
  const conflicts: any[] = [];

  for (const dto of complaints) {
    const geohash = ngeohash.encode(dto.filed_location.lat, dto.filed_location.lng, 7);
    const existing = await repo.findBundleCandidates(geohash, dto.category, 1);

    if (existing.length > 0) {
      duplicates++;
      // Auto-bundle instead of creating new
      const primary = existing[0];
      await repo.updateComplaint(primary.id, { bundle_count: primary.bundle_count + 1 });
    } else {
      await createComplaint(dto, []);
      synced++;
    }
  }

  return { synced, duplicates, conflicts };
}


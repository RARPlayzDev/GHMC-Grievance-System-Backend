// ═══════════════════════════════════════════════════════════════════
// Complaint Intake — Routes
// ═══════════════════════════════════════════════════════════════════

import { Router } from 'express';
import multer from 'multer';
import * as controller from './controller';
import { complaintRateLimiter } from '../../gateway/rate-limiter';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 3 }, // 5MB per file, max 3
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    cb(null, allowed.includes(file.mimetype));
  },
});

export const intakeRouter = Router();

// POST /api/v1/complaints — Create new complaint (anonymous allowed)
intakeRouter.post('/', complaintRateLimiter, upload.array('photos', 3), controller.createComplaint);

// GET /api/v1/complaints/:id — Get complaint by ID
intakeRouter.get('/:id', controller.getComplaint);

// POST /api/v1/complaints/sync — Sync offline complaints
intakeRouter.post('/sync', controller.syncComplaints);


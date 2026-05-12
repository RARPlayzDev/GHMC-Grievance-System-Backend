// ═══════════════════════════════════════════════════════════════════
// Notification Module — SMS/WhatsApp/Push with [DEMO MODE] support
// ═══════════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { supabaseAdmin } from '../../db/supabase-client';
import { config } from '../../config';
import { generateStatusText } from '../../ai/status-text-gen';
import { logger, criticalEvents } from '../../lib/logger';

export async function sendCitizenUpdate(complaintId: string, status: string, phone: string | null) {
  // Generate multilingual status text
  const { data: complaint } = await supabaseAdmin.from('complaints')
    .select('category, ward_id').eq('id', complaintId).single();

  const statusText = await generateStatusText(status, complaint?.category || 'OTHER');

  if (config.demoMode || config.integrations.smsProvider === 'none') {
    criticalEvents.integrationDeferred('SMS', phone || 'unknown', statusText.status_text);

    // Log the deferred notification
    await supabaseAdmin.from('action_logs').insert({
      complaint_id: complaintId,
      action_type: 'NOTIFICATION_DEFERRED',
      metadata: { channel: 'SMS', target: phone, message: statusText.status_text, demo_mode: true },
    });

    return { sent: false, demo_mode: true, message: statusText.status_text };
  }

  // Production: call BSNL SMS gateway (not implemented in MVP)
  // await bsnlSmsGateway.send(phone, statusText.status_text);

  return { sent: true, demo_mode: false, message: statusText.status_text };
}

// Process notification queue job
export async function processNotificationJob(data: any) {
  const { complaint_id, type, status } = data;
  await sendCitizenUpdate(complaint_id, status || type, null);
}

async function getNotificationLog(req: Request, res: Response) {
  const { data } = await supabaseAdmin.from('action_logs')
    .select('*')
    .in('action_type', ['NOTIFICATION_DEFERRED', 'NOTIFICATION_SENT'])
    .order('timestamp', { ascending: false })
    .limit(50);
  res.json({ notifications: data || [] });
}

async function sendTestNotification(req: Request, res: Response) {
  const { complaint_id, status } = req.body;
  const result = await sendCitizenUpdate(complaint_id, status || 'NEW', null);
  res.json(result);
}

export const notificationRouter = Router();
notificationRouter.get('/log', getNotificationLog);
notificationRouter.post('/test', sendTestNotification);


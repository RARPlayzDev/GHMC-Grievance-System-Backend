// ═══════════════════════════════════════════════════════════════════
// Memory Queue — BullMQ in-memory adapter for async task processing
// Swap to Redis-backed BullMQ in production
// ═══════════════════════════════════════════════════════════════════

import { logger } from '../lib/logger';

type JobHandler = (data: any) => Promise<void>;

interface QueueJob {
  id: string;
  queue: string;
  data: any;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  createdAt: Date;
  error?: string;
}

class MemoryQueue {
  private queues: Map<string, JobHandler> = new Map();
  private jobs: QueueJob[] = [];
  private jobCounter = 0;

  registerWorker(queueName: string, handler: JobHandler): void {
    this.queues.set(queueName, handler);
    logger.info(`Queue worker registered: ${queueName}`);
  }

  async addJob(queueName: string, data: any): Promise<string> {
    const id = `job_${++this.jobCounter}_${Date.now()}`;
    const job: QueueJob = { id, queue: queueName, data, status: 'waiting', createdAt: new Date() };
    this.jobs.push(job);

    // Process immediately (in-memory — no persistence)
    const handler = this.queues.get(queueName);
    if (handler) {
      job.status = 'active';
      try {
        await handler(data);
        job.status = 'completed';
      } catch (err: any) {
        job.status = 'failed';
        job.error = err.message;
        logger.error(`Queue job failed: ${queueName}`, { jobId: id, error: err.message });
      }
    } else {
      logger.warn(`No worker registered for queue: ${queueName}`);
    }

    return id;
  }

  getJobStatus(jobId: string): QueueJob | undefined {
    return this.jobs.find((j) => j.id === jobId);
  }

  getQueueStats(queueName: string) {
    const queueJobs = this.jobs.filter((j) => j.queue === queueName);
    return {
      waiting: queueJobs.filter((j) => j.status === 'waiting').length,
      active: queueJobs.filter((j) => j.status === 'active').length,
      completed: queueJobs.filter((j) => j.status === 'completed').length,
      failed: queueJobs.filter((j) => j.status === 'failed').length,
    };
  }
}

export const queue = new MemoryQueue();

// ──────── Queue Names ────────
export const QUEUE_NAMES = {
  AI_CATEGORIZATION: 'ai-categorization',
  AI_ROUTING: 'ai-routing',
  PHOTO_DIFF: 'photo-diff',
  FRAUD_SCORING: 'fraud-scoring',
  NOTIFICATION: 'notification',
  SURGE_FORECAST: 'surge-forecast',
} as const;


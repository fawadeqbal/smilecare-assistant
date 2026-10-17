import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import type { Job } from 'bullmq';
import { IngestDocumentJob, QUEUES } from '@/infrastructure/queue/queue.constants';
import { IngestionService } from './ingestion.service';

/** Worker-side consumer for document ingestion. Concurrency is per worker process. */
@Processor(QUEUES.ingestion, { concurrency: 4 })
export class IngestionProcessor extends WorkerHost {
  private readonly logger = new Logger(IngestionProcessor.name);

  constructor(private readonly ingestion: IngestionService) {
    super();
  }

  async process(job: Job<IngestDocumentJob>) {
    this.logger.log(`Ingesting document ${job.data.documentId} (attempt ${job.attemptsMade + 1})`);
    return this.ingestion.ingest(job.data.documentId);
  }
}

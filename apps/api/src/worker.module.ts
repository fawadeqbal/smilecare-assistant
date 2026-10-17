import { Module } from '@nestjs/common';
import { CoreModule } from './core.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { IngestionProcessor } from './modules/knowledge/ingestion.processor';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { NotificationsProcessor } from './modules/notifications/notifications.processor';

/**
 * Background worker process: consumes queues (document ingestion, notifications).
 * Has no HTTP server. Scale it horizontally by running more replicas.
 */
@Module({
  imports: [CoreModule, KnowledgeModule, BookingsModule],
  providers: [IngestionProcessor, NotificationsProcessor],
})
export class WorkerModule {}

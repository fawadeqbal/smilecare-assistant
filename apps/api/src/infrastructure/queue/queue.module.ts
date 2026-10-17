import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { AppConfig } from '@/config/app-config.service';
import { DEFAULT_JOB_OPTIONS, QUEUES } from './queue.constants';

/**
 * Registers BullMQ queues backed by Redis.
 * The API process only enqueues jobs; the worker process (worker.ts) consumes them,
 * so the two can be scaled independently.
 */
@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => {
        const url = new URL(config.get('REDIS_URL'));
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port || 6379),
            username: url.username || undefined,
            password: url.password || undefined,
            db: url.pathname && url.pathname !== '/' ? Number(url.pathname.slice(1)) : undefined,
            tls: url.protocol === 'rediss:' ? {} : undefined,
          },
          defaultJobOptions: DEFAULT_JOB_OPTIONS,
        };
      },
    }),
    BullModule.registerQueue({ name: QUEUES.ingestion }, { name: QUEUES.notifications }),
  ],
  exports: [BullModule],
})
export class QueueModule {}

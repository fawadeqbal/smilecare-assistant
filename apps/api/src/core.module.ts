import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from './config/config.module';
import { AiModule } from './infrastructure/ai/ai.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { MailModule } from './infrastructure/mail/mail.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { RedisModule } from './infrastructure/redis/redis.module';

/** Infrastructure shared by the API process and the worker process. */
@Module({
  imports: [
    ConfigModule,
    LoggingModule,
    DatabaseModule,
    RedisModule,
    QueueModule,
    AiModule,
    MailModule,
    EventEmitterModule.forRoot({ wildcard: false }),
  ],
})
export class CoreModule {}

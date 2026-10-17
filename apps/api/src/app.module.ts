import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import type Redis from 'ioredis';
import { AppConfig } from './config/app-config.service';
import { CoreModule } from './core.module';
import { REDIS } from './infrastructure/redis/redis.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuthModule } from './modules/auth/auth.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { BusinessesModule } from './modules/businesses/businesses.module';
import { isChatRateLimited } from './modules/chat/chat-rate-limit';
import { ChatModule } from './modules/chat/chat.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { HealthModule } from './modules/health/health.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

/** HTTP API process. */
@Module({
  imports: [
    CoreModule,
    ThrottlerModule.forRootAsync({
      inject: [AppConfig, REDIS],
      useFactory: (config: AppConfig, redis: Redis) => ({
        // Counters live in Redis, so limits hold across every API instance.
        storage: new ThrottlerStorageRedisService(redis),
        throttlers: [
          {
            name: 'default',
            ttl: config.get('RATE_LIMIT_TTL_SECONDS') * 1000,
            limit: config.get('RATE_LIMIT_MAX'),
          },
          {
            name: 'chat',
            ttl: config.get('RATE_LIMIT_TTL_SECONDS') * 1000,
            limit: config.get('CHAT_RATE_LIMIT_MAX'),
            skipIf: (ctx) => !isChatRateLimited(ctx),
          },
        ],
      }),
    }),
    AuthModule,
    BusinessesModule,
    KnowledgeModule,
    ConversationsModule,
    BookingsModule,
    ChatModule,
    NotificationsModule,
    AnalyticsModule,
    HealthModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}

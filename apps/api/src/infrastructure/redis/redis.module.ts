import { Global, Inject, Injectable, Module, OnApplicationShutdown } from '@nestjs/common';
import Redis from 'ioredis';
import { AppConfig } from '@/config/app-config.service';

export const REDIS = Symbol('REDIS');
export const InjectRedis = () => Inject(REDIS);

@Injectable()
class RedisShutdown implements OnApplicationShutdown {
  constructor(@Inject(REDIS) private readonly redis: Redis) {}
  async onApplicationShutdown() {
    await this.redis.quit().catch(() => undefined);
  }
}

/** Shared Redis connection used for rate limiting and health checks. */
@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      inject: [AppConfig],
      useFactory: (config: AppConfig) =>
        // Fail fast: if Redis is down, rate limiting and health checks error out quickly
        // instead of hanging every request. (BullMQ uses its own connections.)
        new Redis(config.get('REDIS_URL'), { maxRetriesPerRequest: 2, connectTimeout: 5_000 }),
    },
    RedisShutdown,
  ],
  exports: [REDIS],
})
export class RedisModule {}

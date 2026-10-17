import { Controller, Get, Inject, Injectable, Module } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, HealthIndicatorService, TerminusModule } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import type Redis from 'ioredis';
import { Pool } from 'pg';
import { Public } from '@/common/decorators';
import { PG_POOL } from '@/infrastructure/database/database.module';
import { REDIS } from '@/infrastructure/redis/redis.module';

@Injectable()
class DependenciesHealth {
  constructor(
    private readonly indicator: HealthIndicatorService,
    @Inject(PG_POOL) private readonly pool: Pool,
    @Inject(REDIS) private readonly redis: Redis,
  ) {}

  async database() {
    const check = this.indicator.check('database');
    try {
      await this.pool.query('select 1');
      return check.up();
    } catch (e) {
      return check.down({ message: (e as Error).message });
    }
  }

  async redisPing() {
    const check = this.indicator.check('redis');
    try {
      await this.redis.ping();
      return check.up();
    } catch (e) {
      return check.down({ message: (e as Error).message });
    }
  }
}

@ApiTags('health')
@Public()
@SkipThrottle()
@Controller('health')
class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly deps: DependenciesHealth,
  ) {}

  /** Liveness: the process is up. */
  @Get('live')
  live() {
    return { status: 'ok' };
  }

  /** Readiness: dependencies reachable. Used by load balancers and docker healthchecks. */
  @Get()
  @HealthCheck()
  ready() {
    return this.health.check([() => this.deps.database(), () => this.deps.redisPing()]);
  }
}

@Module({
  imports: [TerminusModule],
  controllers: [HealthController],
  providers: [DependenciesHealth],
})
export class HealthModule {}

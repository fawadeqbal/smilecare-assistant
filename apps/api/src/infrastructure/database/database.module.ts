import { Global, Inject, Injectable, Module, OnApplicationShutdown } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { AppConfig } from '@/config/app-config.service';
import { schema } from './schema';

export type Database = NodePgDatabase<typeof schema>;

export const DB = Symbol('DB');
export const PG_POOL = Symbol('PG_POOL');

/** Inject the typed Drizzle client: `constructor(@InjectDb() db: Database)`. */
export const InjectDb = () => Inject(DB);

@Injectable()
class PoolShutdown implements OnApplicationShutdown {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}
  async onApplicationShutdown() {
    await this.pool.end();
  }
}

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [AppConfig],
      useFactory: (config: AppConfig) =>
        new Pool({
          connectionString: config.get('DATABASE_URL'),
          max: config.get('DATABASE_POOL_MAX'),
          idleTimeoutMillis: 30_000,
        }),
    },
    {
      provide: DB,
      inject: [PG_POOL],
      useFactory: (pool: Pool): Database => drizzle(pool, { schema }),
    },
    PoolShutdown,
  ],
  exports: [DB, PG_POOL],
})
export class DatabaseModule {}

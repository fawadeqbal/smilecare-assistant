import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/infrastructure/database/schema.ts',
  out: './src/infrastructure/database/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgresql://smilecare:smilecare@localhost:5432/smilecare',
  },
  strict: true,
});

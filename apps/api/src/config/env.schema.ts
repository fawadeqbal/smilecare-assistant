import { z } from 'zod';

const bool = z
  .union([z.boolean(), z.string()])
  .transform((v) => (typeof v === 'boolean' ? v : ['1', 'true', 'yes', 'on'].includes(v.toLowerCase())));

const csv = z
  .string()
  .default('')
  .transform((v) =>
    v
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );

/**
 * Every environment variable the API reads is declared here.
 * The process refuses to start if anything is missing or malformed,
 * so misconfiguration fails fast at boot instead of at the first request.
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  PUBLIC_API_URL: z.string().url().default('http://localhost:4000'),

  // Data stores
  DATABASE_URL: z.string().min(1),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().default(10),
  REDIS_URL: z.string().min(1).default('redis://localhost:6379'),

  // Auth
  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  JWT_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(60 * 60 * 12),

  // CORS: the admin dashboard origin(s). Widget endpoints accept any origin.
  ADMIN_CORS_ORIGINS: csv,

  // LLM (Claude)
  ANTHROPIC_API_KEY: z.string().default(''),
  CLAUDE_MODEL: z.string().default('claude-sonnet-5-5'),
  CLAUDE_MAX_TOKENS: z.coerce.number().int().positive().default(1024),
  CHAT_HISTORY_LIMIT: z.coerce.number().int().positive().default(12),
  CHAT_MAX_TOOL_ROUNDS: z.coerce.number().int().positive().default(4),

  // Embeddings
  EMBEDDING_PROVIDER: z.enum(['voyage', 'local']).default('voyage'),
  VOYAGE_API_KEY: z.string().default(''),
  VOYAGE_MODEL: z.string().default('voyage-4'),

  // Retrieval
  RETRIEVAL_TOP_K: z.coerce.number().int().positive().default(5),
  RETRIEVAL_MIN_SCORE: z.coerce.number().min(0).max(1).default(0.35),
  CHUNK_SIZE_CHARS: z.coerce.number().int().positive().default(1800),
  CHUNK_OVERLAP_CHARS: z.coerce.number().int().nonnegative().default(300),
  UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),

  // Mail
  MAIL_PROVIDER: z.enum(['smtp', 'console']).default('console'),
  MAIL_FROM: z.string().default('SmileCare Assistant <no-reply@smilecare.local>'),
  SMTP_HOST: z.string().default(''),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: bool.default(false),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),

  // Rate limiting (per IP)
  RATE_LIMIT_TTL_SECONDS: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  CHAT_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),

  // Widget bundle served at /widget.js
  WIDGET_BUNDLE_PATH: z.string().default('../widget/dist/widget.js'),

  // Seed
  SEED_ADMIN_EMAIL: z.string().email().default('admin@smilecare.dev'),
  SEED_ADMIN_PASSWORD: z.string().min(8).default('ChangeMe123!'),
  SEED_WIDGET_KEY: z.string().default('pk_demo_smilecare'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  const env = parsed.data;
  if (env.NODE_ENV === 'production') {
    if (!env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY is required in production');
    if (env.EMBEDDING_PROVIDER === 'voyage' && !env.VOYAGE_API_KEY) {
      throw new Error('VOYAGE_API_KEY is required when EMBEDDING_PROVIDER=voyage');
    }
  }
  return env;
}

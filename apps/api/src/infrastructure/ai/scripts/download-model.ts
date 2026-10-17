import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Downloads the embedding model into EMBEDDING_CACHE_DIR ahead of time.
 * The Docker build runs this so containers start without fetching anything.
 */
async function main() {
  for (const file of ['.env.local', '.env']) {
    if (existsSync(file)) process.loadEnvFile(file);
  }
  const model = process.env.EMBEDDING_MODEL ?? 'Xenova/multilingual-e5-small';
  const dtype = (process.env.EMBEDDING_DTYPE ?? 'q8') as 'q8';
  const cacheDir = resolve(process.cwd(), process.env.EMBEDDING_CACHE_DIR ?? './.models');

  const { pipeline, env } = await import('@huggingface/transformers');
  env.cacheDir = cacheDir;
  const extractor = await pipeline('feature-extraction', model, { dtype });
  const out = await extractor(['warm-up'], { pooling: 'mean', normalize: true });
  console.log(`Model ${model} (${dtype}) ready in ${cacheDir}, ${out.dims[1]} dimensions`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

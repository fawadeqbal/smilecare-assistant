import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { AppConfig } from '@/config/app-config.service';
import { EMBEDDINGS_PORT, EmbeddingsPort } from '@/infrastructure/ai/embeddings/embeddings.port';
import { Database, InjectDb } from '@/infrastructure/database/database.module';
import { documents } from '@/infrastructure/database/schema';
import { KnowledgeRepository } from './knowledge.repository';
import { chunkText } from './text-chunker';

/**
 * Chunks and embeds a document, then swaps its chunks in one transaction.
 * Runs inside the worker process (via the queue) or directly from the seed script.
 * Idempotent: re-running it for the same document produces the same result.
 */
@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    @InjectDb() private readonly db: Database,
    @Inject(EMBEDDINGS_PORT) private readonly embeddings: EmbeddingsPort,
    private readonly repo: KnowledgeRepository,
    private readonly config: AppConfig,
  ) {}

  async ingest(documentId: string): Promise<{ chunks: number } | null> {
    const [doc] = await this.db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
    if (!doc) {
      this.logger.warn(`Document ${documentId} no longer exists; skipping`);
      return null;
    }

    await this.repo.setStatus(doc.id, 'processing');
    try {
      const pieces = chunkText(doc.content, {
        maxChars: this.config.get('CHUNK_SIZE_CHARS'),
        overlapChars: this.config.get('CHUNK_OVERLAP_CHARS'),
      });
      // Prefix the document title so each chunk carries its own context.
      const contents = pieces.map((p) => (p.startsWith(doc.title) ? p : `${doc.title}\n${p}`));
      const vectors = contents.length ? await this.embeddings.embed(contents, 'document') : [];

      await this.repo.replaceChunks(
        doc,
        contents.map((content, i) => ({ content, embedding: vectors[i] })),
      );
      this.logger.log(`Indexed "${doc.title}" (${contents.length} chunks)`);
      return { chunks: contents.length };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.repo.setStatus(doc.id, 'failed', message.slice(0, 500));
      throw err;
    }
  }
}

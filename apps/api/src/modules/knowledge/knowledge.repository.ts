import { Injectable } from '@nestjs/common';
import type { DocumentStatus, KnowledgeSearchHit } from '@smilecare/shared';
import { and, cosineDistance, count, desc, eq, sql } from 'drizzle-orm';
import { Database, InjectDb } from '@/infrastructure/database/database.module';
import { documentChunks, DocumentRow, documents } from '@/infrastructure/database/schema';

export type NewDocument = typeof documents.$inferInsert;

@Injectable()
export class KnowledgeRepository {
  constructor(@InjectDb() private readonly db: Database) {}

  async createDocument(input: NewDocument): Promise<DocumentRow> {
    const [row] = await this.db.insert(documents).values(input).returning();
    return row;
  }

  async findDocument(businessId: string, id: string): Promise<DocumentRow | undefined> {
    const [row] = await this.db
      .select()
      .from(documents)
      .where(and(eq(documents.businessId, businessId), eq(documents.id, id)))
      .limit(1);
    return row;
  }

  async listDocuments(businessId: string, limit: number, offset: number) {
    const where = eq(documents.businessId, businessId);
    const [items, [{ total }]] = await Promise.all([
      this.db
        .select({
          id: documents.id,
          title: documents.title,
          sourceType: documents.sourceType,
          status: documents.status,
          chunkCount: documents.chunkCount,
          error: documents.error,
          createdAt: documents.createdAt,
          updatedAt: documents.updatedAt,
        })
        .from(documents)
        .where(where)
        .orderBy(desc(documents.createdAt))
        .limit(limit)
        .offset(offset),
      this.db.select({ total: count() }).from(documents).where(where),
    ]);
    return { items, total };
  }

  async deleteDocument(businessId: string, id: string): Promise<boolean> {
    const rows = await this.db
      .delete(documents)
      .where(and(eq(documents.businessId, businessId), eq(documents.id, id)))
      .returning({ id: documents.id });
    return rows.length > 0;
  }

  async setStatus(id: string, status: DocumentStatus, error: string | null = null): Promise<void> {
    await this.db.update(documents).set({ status, error }).where(eq(documents.id, id));
  }

  /** Atomically swaps a document's chunks, so search never sees a half-indexed document. */
  async replaceChunks(
    document: Pick<DocumentRow, 'id' | 'businessId'>,
    chunks: Array<{ content: string; embedding: number[] }>,
  ): Promise<void> {
    await this.db.transaction(async (tx) => {
      await tx.delete(documentChunks).where(eq(documentChunks.documentId, document.id));
      if (chunks.length) {
        await tx.insert(documentChunks).values(
          chunks.map((c, i) => ({
            documentId: document.id,
            businessId: document.businessId,
            chunkIndex: i,
            content: c.content,
            embedding: c.embedding,
          })),
        );
      }
      await tx
        .update(documents)
        .set({ status: 'ready', chunkCount: chunks.length, error: null })
        .where(eq(documents.id, document.id));
    });
  }

  /**
   * Cosine-similarity search over one tenant's chunks (HNSW index). Score is 1 - cosine distance.
   * The index is shared by all tenants and filtered afterwards, so `efSearch` widens the candidate
   * list to keep recall high for small tenants as the total number of chunks grows.
   */
  async searchChunks(businessId: string, embedding: number[], limit: number, efSearch = 100): Promise<KnowledgeSearchHit[]> {
    const distance = cosineDistance(documentChunks.embedding, embedding);
    const rows = await this.db.transaction(async (tx) => {
      await tx.execute(sql`select set_config('hnsw.ef_search', ${String(efSearch)}, true)`);
      return tx
      .select({
        chunkId: documentChunks.id,
        documentId: documentChunks.documentId,
        documentTitle: documents.title,
        content: documentChunks.content,
        score: sql<number>`1 - (${distance})`,
      })
      .from(documentChunks)
      .innerJoin(documents, eq(documents.id, documentChunks.documentId))
      .where(and(eq(documentChunks.businessId, businessId), eq(documents.status, 'ready')))
      .orderBy(distance)
      .limit(limit);
    });
    return rows.map((r) => ({ ...r, score: Number(r.score) }));
  }
}

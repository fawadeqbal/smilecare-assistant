import { InjectQueue } from '@nestjs/bullmq';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { DocumentSourceType, KnowledgeDocument, Paginated } from '@smilecare/shared';
import type { Queue } from 'bullmq';
import type { DocumentRow } from '@/infrastructure/database/schema';
import { IngestDocumentJob, QUEUES } from '@/infrastructure/queue/queue.constants';
import { KnowledgeRepository } from './knowledge.repository';
import { TextExtractor } from './text-extractor';

const MAX_DOCUMENT_CHARS = 500_000;

@Injectable()
export class KnowledgeService {
  constructor(
    private readonly repo: KnowledgeRepository,
    private readonly extractor: TextExtractor,
    @InjectQueue(QUEUES.ingestion) private readonly ingestionQueue: Queue<IngestDocumentJob>,
  ) {}

  async createFromText(
    businessId: string,
    input: { title: string; content: string; sourceType?: DocumentSourceType },
  ): Promise<KnowledgeDocument> {
    return this.create(businessId, input.title, input.content, input.sourceType ?? 'text');
  }

  async createFromUpload(
    businessId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string },
    title?: string,
  ): Promise<KnowledgeDocument> {
    const { text, sourceType } = await this.extractor.extract(file);
    const name = title?.trim() || file.originalname.replace(/\.[^.]+$/, '');
    return this.create(businessId, name, text, sourceType);
  }

  async list(businessId: string, page: number, pageSize: number): Promise<Paginated<KnowledgeDocument>> {
    const { items, total } = await this.repo.listDocuments(businessId, pageSize, (page - 1) * pageSize);
    return { items: items.map(toDto), total, page, pageSize };
  }

  async get(businessId: string, id: string): Promise<KnowledgeDocument & { content: string }> {
    const doc = await this.repo.findDocument(businessId, id);
    if (!doc) throw new NotFoundException('Document not found');
    return { ...toDto(doc), content: doc.content };
  }

  async reindex(businessId: string, id: string): Promise<KnowledgeDocument> {
    const doc = await this.repo.findDocument(businessId, id);
    if (!doc) throw new NotFoundException('Document not found');
    await this.repo.setStatus(doc.id, 'queued');
    await this.enqueue(doc);
    return toDto({ ...doc, status: 'queued', error: null });
  }

  async remove(businessId: string, id: string): Promise<void> {
    if (!(await this.repo.deleteDocument(businessId, id))) throw new NotFoundException('Document not found');
  }

  private async create(businessId: string, title: string, content: string, sourceType: DocumentSourceType) {
    const text = content.trim();
    if (!text) throw new BadRequestException('Document has no readable text');
    if (text.length > MAX_DOCUMENT_CHARS) {
      throw new BadRequestException(`Document is too long (max ${MAX_DOCUMENT_CHARS.toLocaleString()} characters)`);
    }
    const doc = await this.repo.createDocument({ businessId, title: title.trim(), content: text, sourceType, status: 'queued' });
    await this.enqueue(doc);
    return toDto(doc);
  }

  private async enqueue(doc: DocumentRow) {
    // Ingestion is idempotent, so a unique job id per request is safe and lets re-indexing always run.
    await this.ingestionQueue.add(
      'ingest',
      { businessId: doc.businessId, documentId: doc.id },
      { jobId: `${doc.id}-${Date.now()}` },
    );
  }
}

function toDto(doc: Pick<DocumentRow, 'id' | 'title' | 'sourceType' | 'status' | 'chunkCount' | 'error' | 'createdAt' | 'updatedAt'>): KnowledgeDocument {
  return {
    id: doc.id,
    title: doc.title,
    sourceType: doc.sourceType,
    status: doc.status,
    chunkCount: doc.chunkCount,
    error: doc.error,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

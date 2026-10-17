import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeRepository } from './knowledge.repository';
import { KnowledgeService } from './knowledge.service';
import { RetrievalService } from './retrieval.service';
import { TextExtractor } from './text-extractor';

/** HTTP side of the knowledge base (used by the API process). */
@Module({
  controllers: [KnowledgeController],
  providers: [KnowledgeRepository, KnowledgeService, RetrievalService, TextExtractor, IngestionService],
  exports: [RetrievalService, IngestionService, KnowledgeService],
})
export class KnowledgeModule {}

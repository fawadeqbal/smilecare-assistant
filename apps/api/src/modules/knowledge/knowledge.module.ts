import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { AppConfig } from '@/config/app-config.service';
import { IngestionService } from './ingestion.service';
import { KnowledgeController } from './knowledge.controller';
import { KnowledgeRepository } from './knowledge.repository';
import { KnowledgeService } from './knowledge.service';
import { RetrievalService } from './retrieval.service';
import { TextExtractor } from './text-extractor';

/** HTTP side of the knowledge base (used by the API process). */
@Module({
  imports: [
    MulterModule.registerAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        storage: memoryStorage(),
        limits: { fileSize: config.get('UPLOAD_MAX_BYTES'), files: 1 },
      }),
    }),
  ],
  controllers: [KnowledgeController],
  providers: [KnowledgeRepository, KnowledgeService, RetrievalService, TextExtractor, IngestionService],
  exports: [RetrievalService, IngestionService, KnowledgeService],
})
export class KnowledgeModule {}

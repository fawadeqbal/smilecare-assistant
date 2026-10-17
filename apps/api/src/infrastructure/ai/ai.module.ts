import { Global, Module } from '@nestjs/common';
import { AppConfig } from '@/config/app-config.service';
import { EMBEDDINGS_PORT } from './embeddings/embeddings.port';
import { LocalHashEmbeddingsAdapter } from './embeddings/local-hash-embeddings.adapter';
import { VoyageEmbeddingsAdapter } from './embeddings/voyage-embeddings.adapter';
import { AnthropicLlmAdapter } from './llm/anthropic-llm.adapter';
import { LLM_PORT } from './llm/llm.port';

/**
 * Binds AI ports to their adapters.
 * This is the single place to change when switching or adding a provider.
 */
@Global()
@Module({
  providers: [
    AnthropicLlmAdapter,
    VoyageEmbeddingsAdapter,
    LocalHashEmbeddingsAdapter,
    { provide: LLM_PORT, useExisting: AnthropicLlmAdapter },
    {
      provide: EMBEDDINGS_PORT,
      inject: [AppConfig, VoyageEmbeddingsAdapter, LocalHashEmbeddingsAdapter],
      useFactory: (config: AppConfig, voyage: VoyageEmbeddingsAdapter, local: LocalHashEmbeddingsAdapter) =>
        config.get('EMBEDDING_PROVIDER') === 'voyage' ? voyage : local,
    },
  ],
  exports: [LLM_PORT, EMBEDDINGS_PORT],
})
export class AiModule {}

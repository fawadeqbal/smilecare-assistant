/**
 * Provider-agnostic contract for text embeddings.
 * Retrieval and ingestion depend only on this interface.
 */
export const EMBEDDINGS_PORT = Symbol('EMBEDDINGS_PORT');

/** `document` when indexing knowledge, `query` when embedding a visitor question. */
export type EmbeddingInputType = 'document' | 'query';

export interface EmbeddingsPort {
  readonly dimensions: number;
  embed(texts: string[], inputType: EmbeddingInputType): Promise<number[][]>;
}

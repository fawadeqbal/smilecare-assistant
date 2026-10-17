/**
 * Queue names and job payloads. Producers (API) and consumers (worker)
 * both import from here, so a payload change is a compile error on both sides.
 */
export const QUEUES = {
  ingestion: 'knowledge-ingestion',
  notifications: 'notifications',
} as const;

export interface IngestDocumentJob {
  businessId: string;
  documentId: string;
}

export type NotificationJob =
  | { kind: 'booking.created'; businessId: string; bookingId: string }
  | { kind: 'conversation.handed_off'; businessId: string; conversationId: string; reason: string };

export const DEFAULT_JOB_OPTIONS = {
  attempts: 5,
  backoff: { type: 'exponential' as const, delay: 2_000 },
  removeOnComplete: { age: 24 * 3600, count: 1_000 },
  removeOnFail: { age: 7 * 24 * 3600 },
};

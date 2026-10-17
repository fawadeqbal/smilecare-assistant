import { sql } from 'drizzle-orm';
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  vector,
} from 'drizzle-orm/pg-core';
import type {
  AdminRole,
  BookingStatus,
  ConversationStatus,
  DocumentSourceType,
  DocumentStatus,
  MessageRole,
  MessageSource,
} from '@smilecare/shared';

/**
 * Vector size used by the embeddings column.
 * Must match the embedding model's output (multilingual-e5-small and bge-small produce 384).
 * Changing it requires a new migration and re-embedding all documents.
 */
export const EMBEDDING_DIMENSIONS = 384;

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
};

/** A tenant. Every other row belongs to exactly one business. */
export const businesses = pgTable('businesses', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  widgetKey: text('widget_key').notNull().unique(),
  botName: text('bot_name').notNull().default('SmileCare Assistant'),
  welcomeMessage: text('welcome_message')
    .notNull()
    .default('Hi! I can answer questions about our clinic or help you book an appointment.'),
  brandColor: text('brand_color').notNull().default('#0A66F0'),
  suggestedQuestions: jsonb('suggested_questions').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  handoffEmail: text('handoff_email'),
  notificationEmail: text('notification_email'),
  timezone: text('timezone').notNull().default('UTC'),
  ...timestamps,
});

export const adminUsers = pgTable(
  'admin_users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    role: text('role').$type<AdminRole>().notNull().default('owner'),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex('admin_users_email_uq').on(sql`lower(${t.email})`)],
);

export const documents = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    sourceType: text('source_type').$type<DocumentSourceType>().notNull(),
    status: text('status').$type<DocumentStatus>().notNull().default('queued'),
    /** Extracted plain text, kept so documents can be re-embedded without re-upload. */
    content: text('content').notNull(),
    chunkCount: integer('chunk_count').notNull().default(0),
    error: text('error'),
    ...timestamps,
  },
  (t) => [index('documents_business_idx').on(t.businessId, t.createdAt)],
);

export const documentChunks = pgTable(
  'document_chunks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    documentId: uuid('document_id')
      .notNull()
      .references(() => documents.id, { onDelete: 'cascade' }),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    chunkIndex: integer('chunk_index').notNull(),
    content: text('content').notNull(),
    embedding: vector('embedding', { dimensions: EMBEDDING_DIMENSIONS }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index('document_chunks_business_idx').on(t.businessId),
    index('document_chunks_document_idx').on(t.documentId),
    index('document_chunks_embedding_hnsw_idx').using('hnsw', t.embedding.op('vector_cosine_ops')),
  ],
);

export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    visitorId: text('visitor_id').notNull(),
    status: text('status').$type<ConversationStatus>().notNull().default('open'),
    /** Why Sunny handed this conversation to staff, and when (null if it never was). */
    handoffReason: text('handoff_reason'),
    handedOffAt: timestamp('handed_off_at', { withTimezone: true }),
    ...timestamps,
  },
  (t) => [
    index('conversations_business_updated_idx').on(t.businessId, t.updatedAt),
    index('conversations_business_status_idx').on(t.businessId, t.status),
  ],
);

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    conversationId: uuid('conversation_id')
      .notNull()
      .references(() => conversations.id, { onDelete: 'cascade' }),
    role: text('role').$type<MessageRole>().notNull(),
    content: text('content').notNull(),
    sources: jsonb('sources').$type<MessageSource[]>().notNull().default(sql`'[]'::jsonb`),
    /** Token usage, tool calls and other diagnostics for the assistant turn. */
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('messages_conversation_created_idx').on(t.conversationId, t.createdAt)],
);

export const bookings = pgTable(
  'bookings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'set null' }),
    patientName: text('patient_name').notNull(),
    phone: text('phone').notNull(),
    email: text('email'),
    service: text('service'),
    preferredTime: text('preferred_time'),
    notes: text('notes'),
    status: text('status').$type<BookingStatus>().notNull().default('pending'),
    ...timestamps,
  },
  (t) => [
    index('bookings_business_created_idx').on(t.businessId, t.createdAt),
    index('bookings_business_status_idx').on(t.businessId, t.status),
  ],
);

export const schema = {
  businesses,
  adminUsers,
  documents,
  documentChunks,
  conversations,
  messages,
  bookings,
};

export type BusinessRow = typeof businesses.$inferSelect;
export type AdminUserRow = typeof adminUsers.$inferSelect;
export type DocumentRow = typeof documents.$inferSelect;
export type DocumentChunkRow = typeof documentChunks.$inferSelect;
export type ConversationRow = typeof conversations.$inferSelect;
export type MessageRow = typeof messages.$inferSelect;
export type BookingRow = typeof bookings.$inferSelect;

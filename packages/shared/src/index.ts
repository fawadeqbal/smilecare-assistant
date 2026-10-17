/**
 * API contracts shared by the NestJS API, the Next.js dashboard and the chat widget.
 * Changing a shape here makes every consumer fail to compile until it is updated,
 * which keeps the three apps from drifting apart.
 */

// ---------------------------------------------------------------------------
// Enums / constants
// ---------------------------------------------------------------------------

export const CONVERSATION_STATUSES = ['open', 'handed_off', 'closed'] as const;
export type ConversationStatus = (typeof CONVERSATION_STATUSES)[number];

export const BOOKING_STATUSES = ['pending', 'confirmed', 'cancelled'] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const DOCUMENT_STATUSES = ['queued', 'processing', 'ready', 'failed'] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export const DOCUMENT_SOURCE_TYPES = ['text', 'markdown', 'pdf', 'faq'] as const;
export type DocumentSourceType = (typeof DOCUMENT_SOURCE_TYPES)[number];

export const MESSAGE_ROLES = ['user', 'assistant', 'system'] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];

export const ADMIN_ROLES = ['owner', 'staff'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: AdminRole;
  businessId: string;
  businessName: string;
}

export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: AuthUser;
}

// ---------------------------------------------------------------------------
// Business settings / widget
// ---------------------------------------------------------------------------

export interface WidgetConfig {
  businessName: string;
  botName: string;
  welcomeMessage: string;
  brandColor: string;
  suggestedQuestions: string[];
}

export interface BusinessSettings extends WidgetConfig {
  id: string;
  widgetKey: string;
  handoffEmail: string | null;
  notificationEmail: string | null;
  timezone: string;
}

export type UpdateBusinessSettingsRequest = Partial<
  Pick<
    BusinessSettings,
    | 'businessName'
    | 'botName'
    | 'welcomeMessage'
    | 'brandColor'
    | 'suggestedQuestions'
    | 'handoffEmail'
    | 'notificationEmail'
    | 'timezone'
  >
>;

// ---------------------------------------------------------------------------
// Knowledge base
// ---------------------------------------------------------------------------

export interface KnowledgeDocument {
  id: string;
  title: string;
  sourceType: DocumentSourceType;
  status: DocumentStatus;
  chunkCount: number;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTextDocumentRequest {
  title: string;
  content: string;
  sourceType?: Extract<DocumentSourceType, 'text' | 'markdown' | 'faq'>;
}

export interface KnowledgeSearchRequest {
  query: string;
  limit?: number;
}

export interface KnowledgeSearchHit {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  content: string;
  score: number;
}

// ---------------------------------------------------------------------------
// Chat (public, used by the widget)
// ---------------------------------------------------------------------------

export interface StartSessionRequest {
  widgetKey: string;
  visitorId: string;
}

export interface StartSessionResponse {
  sessionId: string;
  status: ConversationStatus;
}

export interface SendMessageRequest {
  widgetKey: string;
  visitorId: string;
  message: string;
}

export interface SessionHistoryResponse {
  sessionId: string;
  status: ConversationStatus;
  messages: ChatMessage[];
}

export interface MessageSource {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  score: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  sources: MessageSource[];
  createdAt: string;
}

/**
 * Server-sent events streamed by `POST /v1/chat/sessions/:id/messages`.
 * Each SSE frame is `event: <type>` + `data: <json>`.
 */
export type ChatStreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'tool'; name: string; status: 'started' | 'completed' | 'failed' }
  | { type: 'booking'; booking: PublicBookingSummary }
  | { type: 'handoff'; message: string }
  | { type: 'done'; messageId: string; conversationStatus: ConversationStatus; sources: MessageSource[] }
  | { type: 'error'; message: string };

export interface PublicBookingSummary {
  id: string;
  patientName: string;
  service: string | null;
  preferredTime: string | null;
  status: BookingStatus;
}

// ---------------------------------------------------------------------------
// Conversations (admin)
// ---------------------------------------------------------------------------

export interface ConversationSummary {
  id: string;
  visitorId: string;
  status: ConversationStatus;
  messageCount: number;
  lastMessage: string | null;
  /** The visitor's most recent message, e.g. to show what someone waiting for staff asked. */
  lastVisitorMessage: string | null;
  handoffReason: string | null;
  handedOffAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDetail extends ConversationSummary {
  messages: ChatMessage[];
  bookings: Booking[];
}

// ---------------------------------------------------------------------------
// Bookings (admin)
// ---------------------------------------------------------------------------

export interface Booking {
  id: string;
  conversationId: string | null;
  patientName: string;
  phone: string;
  email: string | null;
  service: string | null;
  preferredTime: string | null;
  notes: string | null;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBookingRequest {
  status: BookingStatus;
}

// ---------------------------------------------------------------------------
// Analytics (admin overview)
// ---------------------------------------------------------------------------

export const OVERVIEW_RANGES = [7, 14, 30] as const;
export type OverviewRange = (typeof OVERVIEW_RANGES)[number];

export interface DailyActivity {
  date: string; // YYYY-MM-DD in the business's time zone
  conversations: number;
  bookings: number;
}

export interface OverviewStats {
  range: OverviewRange;
  /** One entry per day for the selected range, oldest first. */
  daily: DailyActivity[];
  /** Last 7 days compared with the 7 days before. */
  week: {
    conversations: number;
    conversationsPrev: number;
    bookings: number;
    bookingsPrev: number;
    /** Conversations in the last 7 days that never needed staff. */
    resolvedBySunny: number;
    visitorMessages: number;
  };
  /** Last 14 days, oldest first, for KPI sparklines. */
  sparks: { conversations: number[]; bookings: number[] };
  waiting: { count: number; longestSince: string | null };
  bookings: { pending: number };
  documents: { total: number; ready: number; chunks: number; lastIndexedAt: string | null };
  /** Knowledge documents Sunny answered from most often in the last 7 days. */
  topTopics: Array<{ label: string; count: number }>;
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  requestId?: string;
}

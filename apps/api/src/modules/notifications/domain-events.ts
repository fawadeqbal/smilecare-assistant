/**
 * In-process domain events. Modules publish facts ("a booking was created");
 * other modules decide what to do about them. The publisher never knows about email,
 * webhooks or CRMs, so adding a new reaction never touches chat or booking code.
 */
export const DomainEvents = {
  BookingCreated: 'booking.created',
  ConversationHandedOff: 'conversation.handed_off',
} as const;

export interface BookingCreatedEvent {
  businessId: string;
  bookingId: string;
}

export interface ConversationHandedOffEvent {
  businessId: string;
  conversationId: string;
  reason: string;
}

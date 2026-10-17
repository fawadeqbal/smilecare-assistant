import { Module } from '@nestjs/common';
import { NotificationEventsListener } from './notification-events.listener';

/** API side: listens for domain events and enqueues notification jobs. */
@Module({
  providers: [NotificationEventsListener],
})
export class NotificationsModule {}

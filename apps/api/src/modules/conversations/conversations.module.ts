import { Module } from '@nestjs/common';
import { BookingsModule } from '@/modules/bookings/bookings.module';
import { ConversationsController } from './conversations.controller';
import { ConversationsRepository } from './conversations.repository';
import { ConversationsService } from './conversations.service';

@Module({
  imports: [BookingsModule],
  controllers: [ConversationsController],
  providers: [ConversationsRepository, ConversationsService],
  exports: [ConversationsRepository, ConversationsService],
})
export class ConversationsModule {}

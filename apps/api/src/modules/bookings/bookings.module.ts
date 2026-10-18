import { Module } from '@nestjs/common';
import { BusinessesModule } from '@/modules/businesses/businesses.module';
import { BookingsController } from './bookings.controller';
import { BookingsRepository } from './bookings.repository';
import { BookingsService } from './bookings.service';
import { PublicBookingsController } from './public-bookings.controller';

@Module({
  imports: [BusinessesModule],
  controllers: [BookingsController, PublicBookingsController],
  providers: [BookingsRepository, BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}

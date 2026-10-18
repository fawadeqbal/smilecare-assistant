import { Body, Controller, Post } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import type { PublicBookingRequest, PublicBookingSummary } from '@smilecare/shared';
import { IsOptional, IsString, Length, Matches } from 'class-validator';
import { Public } from '@/common/decorators';
import { BusinessesService } from '@/modules/businesses/businesses.service';
import { ChatRateLimited } from '@/modules/chat/chat-rate-limit';
import { BookingsService } from './bookings.service';

class PublicBookingDto implements PublicBookingRequest {
  @ApiProperty() @IsString() @Length(4, 100)
  widgetKey: string;

  @ApiProperty({ example: 'Jane Doe' }) @IsString() @Length(2, 120) @Matches(/\S/)
  patientName: string;

  @ApiProperty({ example: '(555) 000-0000' })
  @IsString()
  @Length(7, 25)
  @Matches(/^[+()\-\s\d]*\d{3}[+()\-\s\d]*$/, { message: 'phone must contain only digits, spaces, +, - or parentheses' })
  phone: string;

  @ApiPropertyOptional({ example: 'Checkup and cleaning' }) @IsOptional() @IsString() @Length(0, 120)
  service?: string;

  @ApiProperty({ example: 'Weekday morning' }) @IsString() @Length(2, 120)
  preferredTime: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @Length(0, 1000)
  notes?: string;
}

/**
 * Lets a clinic's own website form create an appointment request directly.
 * Same widget key and the same strict rate limit as chat, since it is just as public.
 */
@ApiTags('bookings')
@Public()
@Controller('public/bookings')
export class PublicBookingsController {
  constructor(
    private readonly businesses: BusinessesService,
    private readonly bookings: BookingsService,
  ) {}

  @Post()
  @ChatRateLimited()
  async create(@Body() dto: PublicBookingDto): Promise<PublicBookingSummary> {
    const business = await this.businesses.getByWidgetKey(dto.widgetKey);
    const b = await this.bookings.create({
      businessId: business.id,
      conversationId: null,
      patientName: dto.patientName,
      phone: dto.phone,
      service: dto.service,
      preferredTime: dto.preferredTime,
      notes: dto.notes ? `From the website form: ${dto.notes}` : 'From the website form',
    });
    return { id: b.id, patientName: b.patientName, service: b.service, preferredTime: b.preferredTime, status: b.status };
  }
}

import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { BOOKING_STATUSES, type Booking, type BookingStatus, type Paginated, type UpdateBookingRequest } from '@smilecare/shared';
import { IsIn, IsOptional } from 'class-validator';
import type { Response } from 'express';
import { BusinessId } from '@/common/decorators';
import { PaginationQuery } from '@/common/http/pagination.dto';
import { BookingsService } from './bookings.service';

class ListBookingsQuery extends PaginationQuery {
  @ApiPropertyOptional({ enum: BOOKING_STATUSES })
  @IsOptional()
  @IsIn(BOOKING_STATUSES)
  status?: BookingStatus;
}

class UpdateBookingDto implements UpdateBookingRequest {
  @ApiProperty({ enum: BOOKING_STATUSES })
  @IsIn(BOOKING_STATUSES)
  status: BookingStatus;
}

@ApiTags('bookings')
@ApiBearerAuth()
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookings: BookingsService) {}

  @Get()
  list(@BusinessId() businessId: string, @Query() q: ListBookingsQuery): Promise<Paginated<Booking>> {
    return this.bookings.list(businessId, q.page, q.pageSize, q.status);
  }

  @Get('export.csv')
  async export(@BusinessId() businessId: string, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="bookings-${new Date().toISOString().slice(0, 10)}.csv"`);
    try {
      for await (const line of this.bookings.exportCsv(businessId)) res.write(line);
      res.end();
    } catch (err) {
      // Headers are already sent, so the only honest signal left is to abort the download.
      res.destroy(err as Error);
    }
  }

  @Get(':id')
  get(@BusinessId() businessId: string, @Param('id', ParseUUIDPipe) id: string): Promise<Booking> {
    return this.bookings.get(businessId, id);
  }

  @Patch(':id')
  update(
    @BusinessId() businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBookingDto,
  ): Promise<Booking> {
    return this.bookings.updateStatus(businessId, id, dto.status);
  }
}

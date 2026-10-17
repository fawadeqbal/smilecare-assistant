import { Controller, Get, Module, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import { OVERVIEW_RANGES, type OverviewRange, type OverviewStats } from '@smilecare/shared';
import { Type } from 'class-transformer';
import { IsIn, IsOptional } from 'class-validator';
import { BusinessId } from '@/common/decorators';
import { BusinessesModule } from '@/modules/businesses/businesses.module';
import { AnalyticsService } from './analytics.service';

class OverviewQuery {
  @ApiPropertyOptional({ enum: OVERVIEW_RANGES, default: 14, description: 'Days of daily activity to return' })
  @IsOptional()
  @Type(() => Number)
  @IsIn(OVERVIEW_RANGES)
  days?: OverviewRange;
}

@ApiTags('analytics')
@ApiBearerAuth()
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('overview')
  overview(@BusinessId() businessId: string, @Query() q: OverviewQuery): Promise<OverviewStats> {
    return this.analytics.overview(businessId, q.days ?? 14);
  }
}

@Module({
  imports: [BusinessesModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}

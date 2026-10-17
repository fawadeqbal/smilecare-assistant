import { Body, Controller, Get, HttpCode, Param, ParseUUIDPipe, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';
import {
  CONVERSATION_STATUSES,
  type ConversationDetail,
  type ConversationStatus,
  type ConversationSummary,
  type Paginated,
} from '@smilecare/shared';
import { IsIn, IsOptional } from 'class-validator';
import { BusinessId } from '@/common/decorators';
import { PaginationQuery } from '@/common/http/pagination.dto';
import { ConversationsService } from './conversations.service';

class ListConversationsQuery extends PaginationQuery {
  @ApiPropertyOptional({ enum: CONVERSATION_STATUSES })
  @IsOptional()
  @IsIn(CONVERSATION_STATUSES)
  status?: ConversationStatus;
}

class UpdateConversationDto {
  @ApiProperty({ enum: CONVERSATION_STATUSES })
  @IsIn(CONVERSATION_STATUSES)
  status: ConversationStatus;
}

@ApiTags('conversations')
@ApiBearerAuth()
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  list(@BusinessId() businessId: string, @Query() q: ListConversationsQuery): Promise<Paginated<ConversationSummary>> {
    return this.conversations.list(businessId, q.page, q.pageSize, q.status);
  }

  @Get(':id')
  get(@BusinessId() businessId: string, @Param('id', ParseUUIDPipe) id: string): Promise<ConversationDetail> {
    return this.conversations.get(businessId, id);
  }

  @Patch(':id')
  @HttpCode(204)
  update(
    @BusinessId() businessId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateConversationDto,
  ): Promise<void> {
    return this.conversations.setStatus(businessId, id, dto.status);
  }
}

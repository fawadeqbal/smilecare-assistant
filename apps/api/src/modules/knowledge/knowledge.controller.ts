import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { KnowledgeDocument, KnowledgeSearchHit, Paginated } from '@smilecare/shared';
import { BusinessId, Roles } from '@/common/decorators';
import { PaginationQuery } from '@/common/http/pagination.dto';
import { CreateTextDocumentDto, KnowledgeSearchDto, UploadDocumentDto } from './dto/knowledge.dto';
import { KnowledgeService } from './knowledge.service';
import { RetrievalService } from './retrieval.service';

@ApiTags('knowledge')
@ApiBearerAuth()
@Controller('knowledge')
export class KnowledgeController {
  constructor(
    private readonly knowledge: KnowledgeService,
    private readonly retrieval: RetrievalService,
  ) {}

  @Get('documents')
  list(@BusinessId() businessId: string, @Query() q: PaginationQuery): Promise<Paginated<KnowledgeDocument>> {
    return this.knowledge.list(businessId, q.page, q.pageSize);
  }

  @Get('documents/:id')
  get(@BusinessId() businessId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.knowledge.get(businessId, id);
  }

  @Post('documents')
  @Roles('owner')
  createText(@BusinessId() businessId: string, @Body() dto: CreateTextDocumentDto): Promise<KnowledgeDocument> {
    return this.knowledge.createFromText(businessId, dto);
  }

  @Post('documents/upload')
  @Roles('owner')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' }, title: { type: 'string' } },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file')) // storage and size limit come from MulterModule in knowledge.module.ts
  upload(
    @BusinessId() businessId: string,
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadDocumentDto,
  ): Promise<KnowledgeDocument> {
    if (!file) throw new BadRequestException('A file is required');
    return this.knowledge.createFromUpload(businessId, file, dto.title);
  }

  @Post('documents/:id/reindex')
  @Roles('owner')
  reindex(@BusinessId() businessId: string, @Param('id', ParseUUIDPipe) id: string): Promise<KnowledgeDocument> {
    return this.knowledge.reindex(businessId, id);
  }

  @Delete('documents/:id')
  @Roles('owner')
  @HttpCode(204)
  remove(@BusinessId() businessId: string, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.knowledge.remove(businessId, id);
  }

  @Post('search')
  @HttpCode(200)
  search(@BusinessId() businessId: string, @Body() dto: KnowledgeSearchDto): Promise<KnowledgeSearchHit[]> {
    return this.retrieval.search(businessId, dto.query, { limit: dto.limit, minScore: 0 });
  }
}

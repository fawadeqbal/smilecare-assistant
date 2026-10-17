import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { CreateTextDocumentRequest, KnowledgeSearchRequest } from '@smilecare/shared';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';

export class CreateTextDocumentDto implements CreateTextDocumentRequest {
  @ApiProperty({ example: 'Opening hours' })
  @IsString()
  @Length(2, 200)
  title: string;

  @ApiProperty({ example: 'Mon-Fri 9am-7pm, Sat 10am-4pm, closed Sunday.' })
  @IsString()
  @Length(1, 500_000)
  content: string;

  @ApiPropertyOptional({ enum: ['text', 'markdown', 'faq'] })
  @IsOptional()
  @IsIn(['text', 'markdown', 'faq'])
  sourceType?: 'text' | 'markdown' | 'faq';
}

export class UploadDocumentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;
}

export class KnowledgeSearchDto implements KnowledgeSearchRequest {
  @ApiProperty({ example: 'How much is teeth whitening?' })
  @IsString()
  @Length(1, 1000)
  query: string;

  @ApiPropertyOptional({ default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number;
}

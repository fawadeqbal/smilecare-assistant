import { ApiPropertyOptional } from '@nestjs/swagger';
import type { UpdateBusinessSettingsRequest } from '@smilecare/shared';
import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  IsTimeZone,
  Length,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class UpdateSettingsDto implements UpdateBusinessSettingsRequest {
  @ApiPropertyOptional() @IsOptional() @IsString() @Length(2, 120)
  businessName?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @Length(2, 60)
  botName?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() @Length(2, 500)
  welcomeMessage?: string;

  @ApiPropertyOptional({ example: '#0E7C66' }) @IsOptional() @Matches(/^#[0-9a-f]{6}$/i, { message: 'brandColor must be a 6-digit hex color like #0E7C66' })
  brandColor?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional() @IsArray() @ArrayMaxSize(6) @IsString({ each: true }) @MaxLength(120, { each: true })
  suggestedQuestions?: string[];

  @ApiPropertyOptional({ nullable: true }) @IsOptional() @ValidateIf((_, v) => v !== null) @IsEmail()
  handoffEmail?: string | null;

  @ApiPropertyOptional({ nullable: true }) @IsOptional() @ValidateIf((_, v) => v !== null) @IsEmail()
  notificationEmail?: string | null;

  @ApiPropertyOptional({ example: 'Asia/Karachi' }) @IsOptional() @IsTimeZone()
  timezone?: string;
}

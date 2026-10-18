import { Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AssistantStatus } from '@smilecare/shared';
import { AssistantStatusService } from './assistant-status.service';

/** Lets the dashboard show whether the assistant can reach its AI model, and why not. */
@ApiTags('assistant')
@ApiBearerAuth()
@Controller('assistant')
export class AssistantStatusController {
  constructor(private readonly status: AssistantStatusService) {}

  @Get('status')
  get(): Promise<AssistantStatus> {
    return this.status.get();
  }

  /** Makes a tiny real request to the model, e.g. after adding credit or a new key. */
  @Post('status/check')
  @HttpCode(200)
  check(): Promise<AssistantStatus> {
    return this.status.check();
  }
}

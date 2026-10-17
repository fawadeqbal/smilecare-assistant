import { Body, Controller, Get, HttpCode, Logger, Param, ParseUUIDPipe, Post, Query, Req, Res } from '@nestjs/common';
import { ApiOkResponse, ApiProperty, ApiTags } from '@nestjs/swagger';
import type {
  ChatStreamEvent,
  SendMessageRequest,
  SessionHistoryResponse,
  StartSessionRequest,
  StartSessionResponse,
} from '@smilecare/shared';
import { IsString, Length, Matches } from 'class-validator';
import type { Request, Response } from 'express';
import { Public } from '@/common/decorators';
import { ChatRateLimited } from './chat-rate-limit';
import { ChatService } from './chat.service';

const VISITOR_ID = /^[A-Za-z0-9_-]{8,64}$/;

class StartSessionDto implements StartSessionRequest {
  @ApiProperty() @IsString() @Length(4, 100)
  widgetKey: string;

  @ApiProperty() @Matches(VISITOR_ID)
  visitorId: string;
}

class SendMessageDto implements SendMessageRequest {
  @ApiProperty() @IsString() @Length(4, 100)
  widgetKey: string;

  @ApiProperty() @Matches(VISITOR_ID)
  visitorId: string;

  @ApiProperty({ example: 'How much is teeth whitening?' }) @IsString() @Length(1, 2000)
  message: string;
}

class HistoryQuery {
  @ApiProperty() @IsString() @Length(4, 100)
  widgetKey: string;

  @ApiProperty() @Matches(VISITOR_ID)
  visitorId: string;
}

/** Public endpoints used by the embeddable widget. */
@ApiTags('chat')
@Public()
@Controller('chat/sessions')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chat: ChatService) {}

  @Post()
  startSession(@Body() dto: StartSessionDto): Promise<StartSessionResponse> {
    return this.chat.startSession(dto.widgetKey, dto.visitorId);
  }

  @Get(':sessionId/messages')
  history(@Param('sessionId', ParseUUIDPipe) sessionId: string, @Query() q: HistoryQuery): Promise<SessionHistoryResponse> {
    return this.chat.history(sessionId, q.widgetKey, q.visitorId);
  }

  /**
   * Sends a visitor message and streams the reply as Server-Sent Events.
   * Event types are defined by `ChatStreamEvent` in @smilecare/shared.
   */
  @Post(':sessionId/messages')
  @HttpCode(200)
  @ChatRateLimited()
  @ApiOkResponse({ description: 'text/event-stream of ChatStreamEvent frames' })
  async send(
    @Param('sessionId', ParseUUIDPipe) sessionId: string,
    @Body() dto: SendMessageDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    // Validate before opening the stream so errors come back as normal JSON responses.
    const session = await this.chat.resolve(sessionId, dto.widgetKey, dto.visitorId);

    res.status(200);
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering
    res.flushHeaders();

    const abort = new AbortController();
    res.on('close', () => {
      if (!res.writableEnded) abort.abort();
    });

    const emit = (event: ChatStreamEvent) => {
      if (res.writableEnded || res.destroyed) return;
      res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
    };
    const heartbeat = setInterval(() => !res.writableEnded && res.write(': ping\n\n'), 15_000);

    try {
      await this.chat.sendMessage(session, dto.message.trim(), emit, abort.signal);
    } catch (err) {
      if (!abort.signal.aborted) {
        this.logger.error({ err, sessionId, requestId: (req as Request & { id?: unknown }).id }, 'Chat turn failed');
        emit({ type: 'error', message: 'Sorry, something went wrong on our side. Please try again in a moment.' });
      }
    } finally {
      clearInterval(heartbeat);
      res.end();
    }
  }
}

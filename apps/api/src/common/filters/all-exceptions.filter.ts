import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { ApiErrorBody } from '@smilecare/shared';
import type { Request, Response } from 'express';

/** Returns a consistent error body for every failure and never leaks internals for 5xx errors. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request & { id?: string }>();

    // Streaming responses (SSE) may already have sent headers; nothing more to do.
    if (res.headersSent) {
      this.logger.error(exception);
      return;
    }

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      const response = exception.getResponse();
      if (typeof response === 'string') message = response;
      else {
        const r = response as { message?: string | string[]; error?: string };
        message = r.message ?? exception.message;
        error = r.error ?? exception.name;
      }
      if (typeof response === 'string') error = exception.name;
    }

    if (status >= 500) this.logger.error({ err: exception, path: req.url }, 'Unhandled error');

    const body: ApiErrorBody = { statusCode: status, error, message, requestId: req.id ? String(req.id) : undefined };
    res.status(status).json(body);
  }
}

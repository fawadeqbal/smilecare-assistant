import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AppConfig } from '@/config/app-config.service';

/** Structured JSON logs in production, pretty logs in development, with a request id on every line. */
@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        pinoHttp: {
          level: config.get('LOG_LEVEL'),
          genReqId: (req, res) => {
            const existing = req.headers['x-request-id'];
            const id = typeof existing === 'string' && existing ? existing : randomUUID();
            res.setHeader('x-request-id', id);
            return id;
          },
          redact: ['req.headers.authorization', 'req.headers.cookie', 'req.body.password'],
          autoLogging: { ignore: (req) => req.url === '/health' || req.url === '/widget.js' },
          transport: config.isProduction
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true, translateTime: 'SYS:HH:MM:ss' } },
        },
      }),
    }),
  ],
})
export class LoggingModule {}

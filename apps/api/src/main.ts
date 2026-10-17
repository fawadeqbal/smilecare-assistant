import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { Express } from 'express';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { AppConfig } from './config/app-config.service';

/** Paths that browsers on any client website may call (the widget). */
const PUBLIC_WIDGET_PATHS = [/^\/v1\/chat\//, /^\/v1\/widget\//, /^\/widget\.js$/];

export async function createApp() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bufferLogs: true });
  configureApp(app);
  return app;
}

/** HTTP pipeline setup, shared by the real server and the e2e tests. */
export function configureApp(app: NestExpressApplication) {
  const config = app.get(AppConfig);

  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));

  // Widget routes are open to every origin (they're embedded on client sites and carry no credentials);
  // admin routes only accept the configured dashboard origins.
  const adminOrigins = new Set(config.get('ADMIN_CORS_ORIGINS'));
  app.enableCors((req: { url?: string; header(name: string): string | undefined }, cb) => {
    const origin = req.header('origin');
    const isWidget = PUBLIC_WIDGET_PATHS.some((re) => re.test(req.url ?? ''));
    const allowed = !origin || isWidget || adminOrigins.has(origin) || (!config.isProduction && adminOrigins.size === 0);
    cb(null, { origin: allowed, credentials: false, maxAge: 600, exposedHeaders: ['x-request-id'] });
  });

  app.setGlobalPrefix('v1', {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'health/live', method: RequestMethod.GET },
    ],
  });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  // Serve the embeddable widget bundle from the API origin, so one <script> tag is all a client needs.
  const widgetPath = resolve(process.cwd(), config.get('WIDGET_BUNDLE_PATH'));
  const server = app.getHttpAdapter().getInstance() as Express;
  server.get('/widget.js', (_req, res) => {
    if (!existsSync(widgetPath)) {
      res.status(404).type('text/plain').send('Widget bundle not built. Run: pnpm --filter @smilecare/widget build');
      return;
    }
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.type('application/javascript').sendFile(widgetPath);
  });

  const swagger = new DocumentBuilder()
    .setTitle('SmileCare Assistant API')
    .setDescription('AI customer-support chatbot: RAG chat, knowledge base, bookings and admin endpoints.')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));
}

async function bootstrap() {
  const app = await createApp();
  const port = app.get(AppConfig).get('PORT');
  await app.listen(port, '0.0.0.0');
  app.get(Logger).log(`API listening on http://localhost:${port} (docs at /docs)`);
}

if (require.main === module) {
  void bootstrap();
}

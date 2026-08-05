import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { ResponseInterceptor } from '@common/interceptors/response.interceptor';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // ── Logger ────────────────────────────────────────────────────────────────
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

  const configService = app.get(ConfigService);
  const port          = configService.get<number>('app.port', 3000);
  const nodeEnv       = configService.get<string>('app.nodeEnv', 'development');
  const corsOrigins   = configService.get<string>('app.corsOrigins', 'http://localhost:3000');

  // ── Security ──────────────────────────────────────────────────────────────
  app.use(helmet());

  app.enableCors({
    origin:      corsOrigins.split(',').map((o) => o.trim()),
    methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: true,
  });

  // ── Versioning ────────────────────────────────────────────────────────────
  app.enableVersioning({ type: VersioningType.URI });

  // ── Global prefix ─────────────────────────────────────────────────────────
  app.setGlobalPrefix('api');

  // ── Global pipes ──────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist:        true,
      forbidNonWhitelisted: true,
      transform:        true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global filters & interceptors ─────────────────────────────────────────
  const reflector = app.get(Reflector);
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new ResponseInterceptor(),
  );

  // ── Swagger (non-production only) ─────────────────────────────────────────
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Newsly API')
      .setDescription('Newsly Phase 1 — Authentication Backend')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', name: 'Authorization', in: 'header' },
        'access-token',
      )
      .addTag('Auth',    'Authentication & authorisation')
      .addTag('Users',   'User profile & device management')
      .addTag('Health',  'Service health checks')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port);
  console.log(`🚀 Newsly API running on http://localhost:${port}/api`);
  if (nodeEnv !== 'production') {
    console.log(`📖 Swagger docs: http://localhost:${port}/api/docs`);
  }
}

bootstrap();

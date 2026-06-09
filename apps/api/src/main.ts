import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ZodExceptionFilter } from './common/filters/zod-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // CORS — allow localhost + any configured frontend + all *.vercel.app previews
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      // Allow any Vercel deployment URL
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      // Allow explicitly whitelisted origins
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: ${origin} not allowed`));
    },
    credentials: true,
  });

  // Global Zod error handler → returns 400 with field-level details
  app.useGlobalFilters(new ZodExceptionFilter());

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Swagger docs (dev only)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Workout Pro API')
      .setDescription('Workout and health management API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.warn(`API running on http://localhost:${port}/api/v1`);
  console.warn(`Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();

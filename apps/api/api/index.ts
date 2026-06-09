import 'reflect-metadata';
import express from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import type { Request, Response } from 'express';

// Lazy import AppModule so it's only loaded on first request
let cachedHandler: express.Express | null = null;
let initPromise: Promise<express.Express> | null = null;

async function createApp(): Promise<express.Express> {
  const { AppModule } = await import('../src/app.module');
  const server = express();
  const app = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['error', 'warn', 'log'],
  });

  app.setGlobalPrefix('api/v1');

  const allowedOrigins = [
    'http://localhost:3000',
    process.env.FRONTEND_URL,
  ].filter(Boolean) as string[];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(null, true);
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );

  await app.init();
  return server;
}

export default async function handler(req: Request, res: Response) {
  if (!initPromise) {
    initPromise = createApp().then((app) => {
      cachedHandler = app;
      return app;
    });
  }
  const app = cachedHandler ?? (await initPromise);
  app(req, res);
}

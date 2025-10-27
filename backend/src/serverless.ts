import { webcrypto } from 'crypto';

// Fix for crypto.randomUUID() not being available globally
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import * as express from 'express';
import { Express } from 'express';
import { INestApplication } from '@nestjs/common';

let cachedServer: Express;
let cachedApp: INestApplication;

async function bootstrapServer(): Promise<Express> {
  if (!cachedServer) {
    const expressApp = express();
    const adapter = new ExpressAdapter(expressApp);

    cachedApp = await NestFactory.create(
      AppModule,
      adapter,
      { logger: ['error', 'warn', 'log', 'debug'] }
    );

    // Global prefix
    cachedApp.setGlobalPrefix('api/v1');

    // CORS configuration - allow all origins for now
    cachedApp.enableCors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    });

    // Global validation pipe
    cachedApp.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    // Swagger configuration
    const config = new DocumentBuilder()
      .setTitle('GSHOP API')
      .setDescription('TikTok Shop Clone MVP API Documentation')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(cachedApp, config);
    SwaggerModule.setup('api/docs', cachedApp, document);

    await cachedApp.init();
    cachedServer = expressApp;

    console.log('✅ NestJS app initialized for Vercel serverless');
  }

  return cachedServer;
}

// Vercel serverless handler
export default async (req: any, res: any) => {
  try {
    const server = await bootstrapServer();
    server(req, res);
  } catch (error) {
    console.error('❌ Serverless function error:', error);

    // Send proper error response
    if (!res.headersSent) {
      res.status(500).json({
        statusCode: 500,
        message: 'Internal server error',
        error: error?.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      });
    }
  }
};

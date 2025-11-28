
import { webcrypto } from 'crypto';

// Fix for crypto.randomUUID() not being available globally
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto as any;
}

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global prefix
  app.setGlobalPrefix('api/v1');
  
  // CORS configuration
  app.enableCors({
    origin: [
      'http://localhost:3001', // Admin web panel
      'http://localhost:3002', // Seller panel
      'http://localhost:19006', // Expo dev server
      /^http:\/\/192\.168\.\d+\.\d+:\d+$/, // Mobile app on local network (any IP)
      /^https:\/\/[a-z0-9]+\.ngrok-free\.app$/, // ngrok URLs
    ],
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(
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
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  
  const port = process.env.API_PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`🚀 GSHOP API is running on: http://localhost:${port}`);
  console.log(`📚 Swagger docs available at: http://localhost:${port}/api/docs`);
}

bootstrap();

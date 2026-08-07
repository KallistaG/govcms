import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('GovCMS-API');
  const app = await NestFactory.create(AppModule);

  const prefix = process.env.API_GLOBAL_PREFIX || 'api/v1';
  app.setGlobalPrefix(prefix);

  // Enable Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable CORS
  const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001').split(',');
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  const port = process.env.API_PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 GovCMS Government API Server running at: http://localhost:${port}/${prefix}`);
}

bootstrap();

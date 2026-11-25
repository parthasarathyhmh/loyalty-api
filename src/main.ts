import { METRICS_CONFIGS } from '@/common/configs/metrics.config';
import { LoggingInterceptor } from '@/common/interceptors/logging.interceptor';
import fastifyHelmet from '@fastify/helmet';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import fastifyMetrics from 'fastify-metrics';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: false, disableRequestLogging: true }),
  );

  if (process.env.NODE_ENV === 'production') {
    await app.register(fastifyHelmet);
  }

  await app.register(fastifyMetrics, METRICS_CONFIGS);

  app.useGlobalInterceptors(new LoggingInterceptor());

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.useLogger(app.get(Logger));

  app.enableCors({ origin: '*', allowedHeaders: '*' });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();

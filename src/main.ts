import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from '@/app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Создаем приложение для получения конфигурации
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Создаем микросервис
  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: configService.get('kafka.clientId') || 'promo-service',
          brokers: configService.get('kafka.brokers') || ['localhost:9092'],
        },
        consumer: {
          groupId: configService.get('kafka.consumer.groupId') || 'promo-service-group',
          allowAutoTopicCreation: true,
        },
      },
    },
  );

  // Настройка валидации
  microservice.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Запуск микросервиса
  await microservice.listen();
  logger.log('🚀 Promo Microservice запущен');
  logger.log(`📨 Kafka Brokers: ${configService.get('kafka.brokers')}`);
  logger.log(`👥 Consumer Group: ${configService.get('kafka.consumer.groupId')}`);

  await app.close();
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Ошибка запуска приложения:', error);
  process.exit(1);
});

import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { PromoController } from '@promo/promo.controller';
import { PromoService } from '@promo/promo.service';
import { PromoCode, PromoCodeSchema } from '@promo/schemas/promo-code.schema';
import { PromoUsage, PromoUsageSchema } from '@promo/schemas/promo-usage.schema';
import { PromoCodeRepository, PROMO_CODE_REPOSITORY_TOKEN } from '@promo/repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PromoCode.name, schema: PromoCodeSchema },
      { name: PromoUsage.name, schema: PromoUsageSchema },
    ]),
    ClientsModule.registerAsync([
      {
        name: 'KAFKA_SERVICE',
        useFactory: (configService: ConfigService) => ({
          transport: Transport.KAFKA,
          options: {
            client: {
              clientId: configService.get('kafka.clientId') || 'promo-service',
              brokers: configService.get('kafka.brokers') || ['localhost:9092'],
            },
            consumer: {
              groupId: configService.get('kafka.consumer.groupId') || 'promo-service-group',
            },
          },
        }),
        inject: [ConfigService],
      },
    ]),
  ],
  controllers: [PromoController],
  providers: [
    PromoService,
    {
      provide: PROMO_CODE_REPOSITORY_TOKEN,
      useClass: PromoCodeRepository,
    },
  ],
  exports: [PromoService, PROMO_CODE_REPOSITORY_TOKEN],
})
export class PromoModule {} 
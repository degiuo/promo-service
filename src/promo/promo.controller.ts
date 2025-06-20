import { Controller, Logger } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';

import { CreatePromoCodeDto, UpdatePromoCodeDto, ActivatePromoCodeDto } from '@promo/dto';
import { PromoService } from '@promo/promo.service';
import { PromoCodeQueryOptions } from '@promo/repository';

interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

function createSuccessResponse<T>(data: T, message?: string): ServiceResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

function createErrorResponse(error: string): ServiceResponse<null> {
  return {
    success: false,
    error,
    data: null,
  };
}

function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): ServiceResponse<{
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}> {
  return {
    success: true,
    data: {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
  };
}

@Controller()
export class PromoController {
  private readonly logger = new Logger(PromoController.name);

  constructor(private readonly promoService: PromoService) {}

  @MessagePattern('promo.create')
  async createPromoCode(@Payload() createPromoCodeDto: CreatePromoCodeDto) {
    try {
      this.logger.log(`Создание промокода: ${createPromoCodeDto.promoCode}`);
      const promoCode = await this.promoService.create(createPromoCodeDto);
      return createSuccessResponse(promoCode, 'Промокод успешно создан');
    } catch (error: any) {
      this.logger.error(`Ошибка создания промокода: ${error.message}`, error.stack);
      return createErrorResponse(error.message);
    }
  }

  @MessagePattern('promo.findById')
  async findPromoCodeById(@Payload() data: { id: string }) {
    try {
      const promoCode = await this.promoService.findOne(data.id);
      return createSuccessResponse(promoCode);
    } catch (error: any) {
      this.logger.error(`Ошибка поиска промокода по ID: ${error.message}`, error.stack);
      return createErrorResponse(error.message);
    }
  }

  @MessagePattern('promo.findByCode')
  async findPromoCodeByCode(@Payload() data: { promoCode: string }) {
    try {
      const promoCode = await this.promoService.findByPromoCode(data.promoCode);
      return createSuccessResponse(promoCode);
    } catch (error: any) {
      this.logger.error(`Ошибка поиска промокода: ${error.message}`, error.stack);
      return createErrorResponse(error.message);
    }
  }

  @MessagePattern('promo.findAll')
  async findAllPromoCodes(@Payload() data?: PromoCodeQueryOptions) {
    try {
      if (data && Object.keys(data).length > 0) {
        const result = await this.promoService.findWithFilters(data);
        return createPaginatedResponse(
          result.data,
          result.total,
          result.page,
          result.limit,
        );
      }
      const promoCodes = await this.promoService.findAll();
      return createSuccessResponse(promoCodes);
    } catch (error: any) {
      this.logger.error(`Ошибка получения промокодов: ${error.message}`, error.stack);
      return createErrorResponse(error.message);
    }
  }

  @MessagePattern('promo.search')
  async searchPromoCodes(@Payload() query: PromoCodeQueryOptions) {
    try {
      const result = await this.promoService.findWithFilters(query);
      return createPaginatedResponse(
        result.data,
        result.total,
        result.page,
        result.limit,
      );
    } catch (error: any) {
      this.logger.error(`Ошибка поиска промокодов: ${error.message}`, error.stack);
      return createErrorResponse(error.message);
    }
  }

  @MessagePattern('promo.update')
  async updatePromoCode(
    @Payload() data: { id: string } & UpdatePromoCodeDto,
  ) {
    try {
      const { id, ...updateData } = data;
      const promoCode = await this.promoService.update(id, updateData);
      return createSuccessResponse(promoCode, 'Промокод успешно обновлен');
    } catch (error: any) {
      this.logger.error(`Ошибка обновления промокода: ${error.message}`, error.stack);
      return createErrorResponse(error.message);
    }
  }

  @MessagePattern('promo.delete')
  async deletePromoCode(@Payload() data: { id: string }) {
    try {
      const result = await this.promoService.remove(data.id);
      return createSuccessResponse(result, 'Промокод успешно удален');
    } catch (error: any) {
      this.logger.error(`Ошибка удаления промокода: ${error.message}`, error.stack);
      return createErrorResponse(error.message);
    }
  }

  @MessagePattern('promo.activate')
  async activatePromoCode(@Payload() activateDto: ActivatePromoCodeDto) {
    try {
      this.logger.log(`Активация промокода ${activateDto.promoCode} пользователем ${activateDto.userId}`);
      const result = await this.promoService.activatePromoCode(activateDto);
      return createSuccessResponse(result, `Промокод успешно активирован! Начислено ${result.bonusAmount}$`);
    } catch (error: any) {
      this.logger.error(`Ошибка активации промокода: ${error.message}`, error.stack);
      return createErrorResponse(error.message);
    }
  }

  @MessagePattern('promo.count')
  async countPromoCodes() {
    try {
      const count = await this.promoService.count();
      return createSuccessResponse(count);
    } catch (error: any) {
      this.logger.error(`Ошибка подсчета промокодов: ${error.message}`, error.stack);
      return createErrorResponse(error.message);
    }
  }

  @MessagePattern('promo.stats')
  async getPromoCodeStats() {
    try {
      const stats = await this.promoService.getStats();
      return createSuccessResponse(stats);
    } catch (error: any) {
      this.logger.error(`Ошибка получения статистики: ${error.message}`, error.stack);
      return createErrorResponse(error.message);
    }
  }

  // Kafka Events Handlers
  @EventPattern('promo.created')
  async handlePromoCodeCreated(@Payload() event: any) {
    try {
      this.logger.log(`Обработка события создания промокода: ${JSON.stringify(event)}`);
      // Здесь можно добавить логику для обработки события создания промокода
      // Например, отправка уведомлений, логирование, аналитика и т.д.
    } catch (error: any) {
      this.logger.error('Ошибка обработки события создания промокода:', error);
    }
  }

  @EventPattern('promo.activated')
  async handlePromoCodeActivated(@Payload() event: any) {
    try {
      this.logger.log(`Обработка события активации промокода: ${JSON.stringify(event)}`);
      // Здесь можно добавить логику для обработки события активации промокода
      // Например, начисление бонусов, отправка уведомлений и т.д.
    } catch (error: any) {
      this.logger.error('Ошибка обработки события активации промокода:', error);
    }
  }

  @EventPattern('promo.expired')
  async handlePromoCodeExpired(@Payload() event: any) {
    try {
      this.logger.log(`Обработка события истечения промокода: ${JSON.stringify(event)}`);
      // Здесь можно добавить логику для обработки события истечения промокода
      // Например, уведомления, аналитика и т.д.
    } catch (error: any) {
      this.logger.error('Ошибка обработки события истечения промокода:', error);
    }
  }

  @EventPattern('user.registered')
  async handleUserRegistered(@Payload() event: any) {
    try {
      this.logger.log(`Обработка события регистрации пользователя: ${JSON.stringify(event)}`);
      // Здесь можно добавить логику для автоматической выдачи промокодов новым пользователям
      // Например, приветственный промокод
    } catch (error: any) {
      this.logger.error('Ошибка обработки события регистрации пользователя:', error);
    }
  }
} 
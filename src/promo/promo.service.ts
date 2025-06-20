import { Inject, Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

import {
  PromoCodeNotFoundException,
  PromoCodeExpiredException,
  PromoCodeDisabledException,
  PromoCodeMaxUsagesReachedException,
  PromoCodeValidationException,
  PromoCodeUsageException,
} from '@common/exceptions';
import { CreatePromoCodeDto, UpdatePromoCodeDto, ActivatePromoCodeDto } from './dto';
import {
  IPromoCodeRepository,
  PaginatedResult,
  PromoCodeQueryOptions,
  PROMO_CODE_REPOSITORY_TOKEN,
} from './repository';
import { PromoCode, PromoCodeStatus } from './schemas/promo-code.schema';

@Injectable()
export class PromoService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PromoService.name);

  constructor(
    @Inject(PROMO_CODE_REPOSITORY_TOKEN)
    private readonly promoCodeRepository: IPromoCodeRepository,
    @Inject('KAFKA_SERVICE')
    private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit() {
    // Подписываемся на события Kafka
    this.kafkaClient.subscribeToResponseOf('promo.created');
    this.kafkaClient.subscribeToResponseOf('promo.activated');
    this.kafkaClient.subscribeToResponseOf('promo.expired');
    this.kafkaClient.subscribeToResponseOf('balance.updated');
    
    await this.kafkaClient.connect();
    this.logger.log('Kafka клиент подключен');
  }

  async onModuleDestroy() {
    await this.kafkaClient.close();
    this.logger.log('Kafka клиент отключен');
  }

  // Kafka события
  private async emitPromoCodeCreated(promoCode: string, data: any) {
    const event = {
      eventType: 'promo.created',
      timestamp: new Date().toISOString(),
      promoCode,
      data,
    };

    this.logger.log(`Отправка события создания промокода: ${promoCode}`);
    return this.kafkaClient.emit('promo.created', event);
  }

  private async emitPromoCodeActivated(promoCode: string, userId: string, bonusAmount: number) {
    const event = {
      eventType: 'promo.activated',
      timestamp: new Date().toISOString(),
      promoCode,
      userId,
      bonusAmount,
    };

    this.logger.log(`Отправка события активации промокода: ${promoCode} пользователем ${userId}`);
    return this.kafkaClient.emit('promo.activated', event);
  }

  private async emitPromoCodeExpired(promoCode: string) {
    const event = {
      eventType: 'promo.expired',
      timestamp: new Date().toISOString(),
      promoCode,
    };

    this.logger.log(`Отправка события истечения промокода: ${promoCode}`);
    return this.kafkaClient.emit('promo.expired', event);
  }

  private async emitBalanceUpdated(userId: string, amount: number, reason: string) {
    const event = {
      eventType: 'balance.updated',
      timestamp: new Date().toISOString(),
      userId,
      amount,
      reason,
    };

    this.logger.log(`Отправка события обновления баланса: пользователь ${userId}, сумма ${amount}`);
    return this.kafkaClient.emit('balance.updated', event);
  }

  async create(createPromoCodeDto: CreatePromoCodeDto): Promise<PromoCode> {
    this.logger.log(`Создание промокода: ${createPromoCodeDto.promoCode}`);

    // Валидация данных
    if (!createPromoCodeDto.promoCode || !createPromoCodeDto.bonusAmount) {
      throw new PromoCodeValidationException(
        'promoCode/bonusAmount',
        { promoCode: createPromoCodeDto.promoCode, bonusAmount: createPromoCodeDto.bonusAmount },
        'Промокод и сумма бонуса обязательны',
      );
    }

    // Проверка на существование промокода
    const existingPromoCode = await this.promoCodeRepository.findByPromoCode(
      createPromoCodeDto.promoCode,
    );
    if (existingPromoCode) {
      throw new PromoCodeValidationException(
        'promoCode',
        createPromoCodeDto.promoCode,
        'Промокод уже существует',
      );
    }

    // Валидация даты истечения
    if (createPromoCodeDto.expiresAt && createPromoCodeDto.expiresAt <= new Date()) {
      throw new PromoCodeValidationException(
        'expiresAt',
        createPromoCodeDto.expiresAt,
        'Дата истечения должна быть в будущем',
      );
    }

    const promoCode = await this.promoCodeRepository.create(createPromoCodeDto);

    // Отправляем Kafka событие
    await this.emitPromoCodeCreated(promoCode.promoCode, promoCode);

    return promoCode;
  }

  async findAll(): Promise<PromoCode[]> {
    return this.promoCodeRepository.findAll();
  }

  async findOne(id: string): Promise<PromoCode> {
    this.logger.debug(`Поиск промокода по ID: ${id}`);

    if (!id) {
      throw new PromoCodeValidationException('id', id, 'ID промокода обязателен');
    }

    const promoCode = await this.promoCodeRepository.findById(id);
    if (!promoCode) {
      throw new PromoCodeNotFoundException(id);
    }

    return promoCode;
  }

  async findByPromoCode(promoCode: string): Promise<PromoCode | null> {
    if (!promoCode) {
      throw new PromoCodeValidationException('promoCode', promoCode, 'Промокод обязателен');
    }

    return this.promoCodeRepository.findByPromoCode(promoCode);
  }

  async update(id: string, updatePromoCodeDto: UpdatePromoCodeDto): Promise<PromoCode> {
    this.logger.log(`Обновление промокода: ${id}`);

    if (!id) {
      throw new PromoCodeValidationException('id', id, 'ID промокода обязателен');
    }

    // Валидация даты истечения
    if (updatePromoCodeDto.expiresAt && updatePromoCodeDto.expiresAt <= new Date()) {
      throw new PromoCodeValidationException(
        'expiresAt',
        updatePromoCodeDto.expiresAt,
        'Дата истечения должна быть в будущем',
      );
    }

    const promoCode = await this.promoCodeRepository.update(id, updatePromoCodeDto);
    if (!promoCode) {
      throw new PromoCodeNotFoundException(id);
    }

    // Если промокод истек, отправляем событие
    if (updatePromoCodeDto.status === PromoCodeStatus.EXPIRED) {
      await this.emitPromoCodeExpired(promoCode.promoCode);
    }

    return promoCode;
  }

  async remove(id: string): Promise<PromoCode> {
    this.logger.log(`Удаление промокода: ${id}`);

    if (!id) {
      throw new PromoCodeValidationException('id', id, 'ID промокода обязателен');
    }

    const promoCode = await this.promoCodeRepository.delete(id);
    if (!promoCode) {
      throw new PromoCodeNotFoundException(id);
    }

    return promoCode;
  }

  async findWithFilters(options: PromoCodeQueryOptions): Promise<PaginatedResult<PromoCode>> {
    return this.promoCodeRepository.findWithFilters(options);
  }

  async count(): Promise<number> {
    return this.promoCodeRepository.count();
  }

  async activatePromoCode(activateDto: ActivatePromoCodeDto): Promise<{
    success: boolean;
    bonusAmount: number;
    promoCode: PromoCode;
  }> {
    this.logger.log(`Активация промокода ${activateDto.promoCode} пользователем ${activateDto.userId}`);

    const { promoCode: code, userId } = activateDto;

    // Поиск активного промокода
    const promoCode = await this.promoCodeRepository.findActivePromoCode(code);
    if (!promoCode) {
      throw new PromoCodeNotFoundException(code);
    }

    // Проверка статуса
    if (promoCode.status === PromoCodeStatus.DISABLED) {
      throw new PromoCodeDisabledException(code);
    }

    if (promoCode.status === PromoCodeStatus.EXPIRED) {
      throw new PromoCodeExpiredException(code);
    }

    // Проверка даты истечения
    if (promoCode.expiresAt && promoCode.expiresAt <= new Date()) {
      throw new PromoCodeExpiredException(code);
    }

    // Проверка максимального количества использований
    if (promoCode.maxUsages && promoCode.usageCount >= promoCode.maxUsages) {
      throw new PromoCodeMaxUsagesReachedException(code);
    }

    try {
      // Увеличиваем счетчик использования
      const updatedPromoCode = await this.promoCodeRepository.incrementUsageCount(code);
      if (!updatedPromoCode) {
        throw new PromoCodeUsageException(code, userId, 'Не удалось обновить счетчик использования');
      }

      // Отправляем Kafka события
      await Promise.all([
        this.emitPromoCodeActivated(code, userId, promoCode.bonusAmount),
        this.emitBalanceUpdated(userId, promoCode.bonusAmount, `Активация промокода ${code}`),
      ]);

      this.logger.log(
        `Промокод ${code} успешно активирован пользователем ${userId}. Бонус: ${promoCode.bonusAmount}$`,
      );

      return {
        success: true,
        bonusAmount: promoCode.bonusAmount,
        promoCode: updatedPromoCode,
      };
    } catch (error: any) {
      this.logger.error(`Ошибка активации промокода ${code}: ${error.message}`, error.stack);
      throw new PromoCodeUsageException(code, userId, error.message);
    }
  }

  async getStats(): Promise<{
    totalPromoCodes: number;
    activePromoCodes: number;
    expiredPromoCodes: number;
    disabledPromoCodes: number;
    totalUsages: number;
  }> {
    const allPromoCodes = await this.promoCodeRepository.findAll();
    
    const stats = {
      totalPromoCodes: allPromoCodes.length,
      activePromoCodes: 0,
      expiredPromoCodes: 0,
      disabledPromoCodes: 0,
      totalUsages: 0,
    };

    const now = new Date();

    allPromoCodes.forEach((promoCode) => {
      stats.totalUsages += promoCode.usageCount;

      if (promoCode.status === PromoCodeStatus.DISABLED) {
        stats.disabledPromoCodes++;
      } else if (promoCode.status === PromoCodeStatus.EXPIRED || 
                 (promoCode.expiresAt && promoCode.expiresAt <= now)) {
        stats.expiredPromoCodes++;
      } else if (promoCode.status === PromoCodeStatus.ACTIVE) {
        stats.activePromoCodes++;
      }
    });

    return stats;
  }
} 
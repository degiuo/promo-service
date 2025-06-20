import { Model } from 'mongoose';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import {
  DatabaseOperationException,
  PromoCodeAlreadyExistsException,
} from '@common/exceptions';
import { CreatePromoCodeDto, UpdatePromoCodeDto } from '../dto';
import {
  IPromoCodeRepository,
  PaginatedResult,
  PromoCodeQueryOptions,
} from './promo-code.repository.interface';
import { PromoCode, PromoCodeDocument, PromoCodeStatus } from '../schemas/promo-code.schema';

@Injectable()
export class PromoCodeRepository implements IPromoCodeRepository {
  private readonly logger = new Logger(PromoCodeRepository.name);

  constructor(
    @InjectModel(PromoCode.name)
    private readonly promoCodeModel: Model<PromoCodeDocument>,
  ) {}

  async create(createPromoCodeDto: CreatePromoCodeDto): Promise<PromoCode> {
    try {
      this.logger.log(`Создание промокода: ${createPromoCodeDto.promoCode}`);
      return await this.promoCodeModel.create(createPromoCodeDto);
    } catch (error: any) {
      this.logger.error(`Ошибка создания промокода: ${error.message}`, error.stack);

      if (error.code === 11000) {
        throw new PromoCodeAlreadyExistsException(createPromoCodeDto.promoCode, {
          mongoError: error.message,
        });
      }

      throw new DatabaseOperationException('создание промокода', error.message);
    }
  }

  async findAll(): Promise<PromoCode[]> {
    return this.promoCodeModel
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string): Promise<PromoCode | null> {
    try {
      this.logger.debug(`Поиск промокода по ID: ${id}`);
      const promoCode = await this.promoCodeModel.findById(id).exec();

      if (!promoCode) {
        this.logger.debug(`Промокод не найден с ID: ${id}`);
        return null;
      }

      return promoCode;
    } catch (error: any) {
      this.logger.error(`Ошибка поиска промокода по ID ${id}: ${error.message}`, error.stack);
      throw new DatabaseOperationException('поиск промокода по ID', error.message, {
        promoCodeId: id,
      });
    }
  }

  async findByPromoCode(promoCode: string): Promise<PromoCode | null> {
    try {
      this.logger.debug(`Поиск промокода: ${promoCode}`);
      const result = await this.promoCodeModel
        .findOne({ promoCode: promoCode.toUpperCase(), isActive: true })
        .exec();

      if (!result) {
        this.logger.debug(`Промокод не найден: ${promoCode}`);
        return null;
      }

      return result;
    } catch (error: any) {
      this.logger.error(`Ошибка поиска промокода ${promoCode}: ${error.message}`, error.stack);
      throw new DatabaseOperationException('поиск промокода', error.message, { promoCode });
    }
  }

  async update(id: string, updatePromoCodeDto: UpdatePromoCodeDto): Promise<PromoCode | null> {
    return this.promoCodeModel
      .findByIdAndUpdate(id, { ...updatePromoCodeDto, updatedAt: new Date() }, { new: true })
      .exec();
  }

  async delete(id: string): Promise<PromoCode | null> {
    return this.promoCodeModel
      .findByIdAndUpdate(id, { isActive: false, updatedAt: new Date() }, { new: true })
      .exec();
  }

  async findWithFilters(options: PromoCodeQueryOptions): Promise<PaginatedResult<PromoCode>> {
    const {
      page = 1,
      limit = 10,
      status,
      search,
      isActive = true,
      includeExpired = false,
    } = options;
    const skip = (page - 1) * limit;

    const filter: any = { isActive };

    if (status) {
      filter.status = status;
    }

    if (search) {
      filter.$or = [
        { promoCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (!includeExpired) {
      filter.$or = [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gte: new Date() } },
      ];
    }

    const [data, total] = await Promise.all([
      this.promoCodeModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.promoCodeModel.countDocuments(filter).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async count(): Promise<number> {
    return this.promoCodeModel.countDocuments({ isActive: true }).exec();
  }

  async existsByPromoCode(promoCode: string): Promise<boolean> {
    const result = await this.promoCodeModel
      .findOne({ promoCode: promoCode.toUpperCase(), isActive: true })
      .select('_id')
      .exec();
    return !!result;
  }

  async incrementUsageCount(promoCode: string): Promise<PromoCode | null> {
    return this.promoCodeModel
      .findOneAndUpdate(
        { promoCode: promoCode.toUpperCase(), isActive: true },
        { $inc: { usageCount: 1 }, updatedAt: new Date() },
        { new: true }
      )
      .exec();
  }

  async findActivePromoCode(promoCode: string): Promise<PromoCode | null> {
    const now = new Date();
    
    return this.promoCodeModel
      .findOne({
        promoCode: promoCode.toUpperCase(),
        isActive: true,
        status: PromoCodeStatus.ACTIVE,
        $or: [
          { expiresAt: { $exists: false } },
          { expiresAt: { $gte: now } },
        ],
      })
      .exec();
  }
} 
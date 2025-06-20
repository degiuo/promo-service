import { CreatePromoCodeDto, UpdatePromoCodeDto } from '../dto';
import { PromoCode } from '../schemas/promo-code.schema';

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PromoCodeQueryOptions {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  isActive?: boolean;
  includeExpired?: boolean;
}

export interface IPromoCodeRepository {
  create(createPromoCodeDto: CreatePromoCodeDto): Promise<PromoCode>;
  findAll(): Promise<PromoCode[]>;
  findById(id: string): Promise<PromoCode | null>;
  findByPromoCode(promoCode: string): Promise<PromoCode | null>;
  update(id: string, updatePromoCodeDto: UpdatePromoCodeDto): Promise<PromoCode | null>;
  delete(id: string): Promise<PromoCode | null>;
  findWithFilters(options: PromoCodeQueryOptions): Promise<PaginatedResult<PromoCode>>;
  count(): Promise<number>;
  existsByPromoCode(promoCode: string): Promise<boolean>;
  incrementUsageCount(promoCode: string): Promise<PromoCode | null>;
  findActivePromoCode(promoCode: string): Promise<PromoCode | null>;
} 
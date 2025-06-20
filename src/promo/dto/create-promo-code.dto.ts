import { Transform } from 'class-transformer';
import { 
  IsString, 
  IsNumber, 
  IsOptional, 
  IsEnum, 
  IsDate, 
  Min, 
  IsBoolean,
  MaxLength,
  MinLength 
} from 'class-validator';
import { PromoCodeStatus } from '../schemas/promo-code.schema';

export class CreatePromoCodeDto {
  @IsString()
  @MinLength(3, { message: 'Промокод должен содержать минимум 3 символа' })
  @MaxLength(50, { message: 'Промокод не может быть длиннее 50 символов' })
  @Transform(({ value }) => value?.toString().trim().toUpperCase())
  promoCode: string;

  @IsNumber({}, { message: 'Сумма бонуса должна быть числом' })
  @Min(0.01, { message: 'Сумма бонуса должна быть больше 0' })
  @Transform(({ value }) => parseFloat(value))
  bonusAmount: number;

  @IsOptional()
  @IsNumber({}, { message: 'Максимальное количество использований должно быть числом' })
  @Min(1, { message: 'Максимальное количество использований должно быть больше 0' })
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  maxUsages?: number;

  @IsOptional()
  @IsEnum(PromoCodeStatus, { message: 'Неверный статус промокода' })
  status?: PromoCodeStatus;

  @IsOptional()
  @IsDate({ message: 'Дата истечения должна быть валидной датой' })
  @Transform(({ value }) => value ? new Date(value) : undefined)
  expiresAt?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Описание не может быть длиннее 500 символов' })
  @Transform(({ value }) => value?.toString().trim())
  description?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.toString().trim())
  createdBy?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === true || value === 'true')
  isActive?: boolean;
} 
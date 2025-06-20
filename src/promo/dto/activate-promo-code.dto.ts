import { Transform } from 'class-transformer';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class ActivatePromoCodeDto {
  @IsString({ message: 'Промокод должен быть строкой' })
  @MinLength(3, { message: 'Промокод должен содержать минимум 3 символа' })
  @MaxLength(50, { message: 'Промокод не может быть длиннее 50 символов' })
  @Transform(({ value }) => value?.toString().trim().toUpperCase())
  promoCode: string;

  @IsString({ message: 'ID пользователя должен быть строкой' })
  @Transform(({ value }) => value?.toString().trim())
  userId: string;
} 
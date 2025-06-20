import { BaseServiceException, ErrorContext } from './base.exception';

export class PromoCodeNotFoundException extends BaseServiceException {
  constructor(promoCode: string, context?: ErrorContext) {
    super(`Промокод не найден: ${promoCode}`, 'PROMO_CODE_NOT_FOUND', { promoCode, ...context });
  }
}

export class PromoCodeAlreadyExistsException extends BaseServiceException {
  constructor(promoCode: string, context?: ErrorContext) {
    super(`Промокод '${promoCode}' уже существует`, 'PROMO_CODE_ALREADY_EXISTS', {
      promoCode,
      ...context,
    });
  }
}

export class PromoCodeExpiredException extends BaseServiceException {
  constructor(promoCode: string, context?: ErrorContext) {
    super(`Промокод '${promoCode}' истек`, 'PROMO_CODE_EXPIRED', {
      promoCode,
      ...context,
    });
  }
}

export class PromoCodeDisabledException extends BaseServiceException {
  constructor(promoCode: string, context?: ErrorContext) {
    super(`Промокод '${promoCode}' отключен`, 'PROMO_CODE_DISABLED', {
      promoCode,
      ...context,
    });
  }
}

export class PromoCodeMaxUsagesReachedException extends BaseServiceException {
  constructor(promoCode: string, context?: ErrorContext) {
    super(`Промокод '${promoCode}' достиг максимального количества использований`, 'PROMO_CODE_MAX_USAGES_REACHED', {
      promoCode,
      ...context,
    });
  }
}

export class PromoCodeValidationException extends BaseServiceException {
  constructor(field: string, value: any, reason: string, context?: ErrorContext) {
    super(`Ошибка валидации поля '${field}': ${reason}`, 'PROMO_CODE_VALIDATION_ERROR', {
      field,
      value,
      reason,
      ...context,
    });
  }
}

export class PromoCodeUsageException extends BaseServiceException {
  constructor(promoCode: string, userId: string, reason: string, context?: ErrorContext) {
    super(`Ошибка использования промокода '${promoCode}' пользователем ${userId}: ${reason}`, 'PROMO_CODE_USAGE_ERROR', {
      promoCode,
      userId,
      reason,
      ...context,
    });
  }
}

export class DatabaseOperationException extends BaseServiceException {
  constructor(operation: string, details?: string, context?: ErrorContext) {
    super(
      `Ошибка операции с базой данных: ${operation}${details ? ` - ${details}` : ''}`,
      'DATABASE_ERROR',
      { operation, details, ...context },
    );
  }
} 
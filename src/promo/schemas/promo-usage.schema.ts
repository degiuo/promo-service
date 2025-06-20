import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type PromoUsageDocument = PromoUsage & Document;

@Schema({
  timestamps: { createdAt: 'usedAt', updatedAt: 'updatedAt' },
  collection: 'promousages',
})
export class PromoUsage {
  @Prop({ type: String, required: true })
  promoCode: string;

  @Prop({ type: String, required: true })
  userId: string;

  @Prop({ type: Number, required: true })
  bonusAmount: number;

  @Prop({ type: String, required: false })
  userIP?: string;

  @Prop({ type: String, required: false })
  userAgent?: string;

  @Prop({ type: Boolean, default: true })
  isValid: boolean;

  @Prop({ type: String, required: false })
  invalidationReason?: string;

  usedAt?: Date;
  updatedAt?: Date;
}

export const PromoUsageSchema = SchemaFactory.createForClass(PromoUsage);

// Добавляем индексы для оптимизации запросов
PromoUsageSchema.index({ promoCode: 1 });
PromoUsageSchema.index({ userId: 1 });
PromoUsageSchema.index({ usedAt: -1 });
PromoUsageSchema.index({ promoCode: 1, userId: 1 }, { unique: true }); 
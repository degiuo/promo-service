import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type PromoCodeDocument = PromoCode & Document;

export enum PromoCodeStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  DISABLED = 'disabled',
}

@Schema({
  timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' },
  collection: 'promocodes',
})
export class PromoCode {
  @Prop({ type: String, required: true, unique: true })
  promoCode: string;

  @Prop({ type: Number, required: true, min: 0 })
  bonusAmount: number;

  @Prop({ type: Number, default: 0, min: 0 })
  usageCount: number;

  @Prop({ type: Number, required: false, min: 1 })
  maxUsages?: number;

  @Prop({ 
    type: String, 
    enum: Object.values(PromoCodeStatus), 
    default: PromoCodeStatus.ACTIVE 
  })
  status: PromoCodeStatus;

  @Prop({ type: Date, required: false })
  expiresAt?: Date;

  @Prop({ type: String, required: false })
  description?: string;

  @Prop({ type: String, required: false })
  createdBy?: string;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PromoCodeSchema = SchemaFactory.createForClass(PromoCode);

// Добавляем индексы для оптимизации запросов
PromoCodeSchema.index({ promoCode: 1 });
PromoCodeSchema.index({ status: 1 });
PromoCodeSchema.index({ expiresAt: 1 });
PromoCodeSchema.index({ isActive: 1 }); 
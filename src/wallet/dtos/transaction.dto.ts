import { IsEnum, IsOptional } from 'class-validator';
import { Paginated } from '../../common/listing/pagination';

export enum TransactionStatus {
  All = 'all',
  Converted = 'converted',
  Pending = 'pending',
  Credited = 'credited',
  Redeemed = 'redeemed',
}

export enum TransactionRange {
  All = 'all',
  Month = 'month',
  Quarter = 'quarter',
  HalfYear = 'halfYear',
}

export enum CreditSource {
  Order = 'order',
  Bonus = 'bonus',
  Milestone = 'milestone',
}

export enum RedeemSource {
  Coupon = 'coupon',
  Recharge = 'recharge',
  Order = 'order',
}

type TransactionSource = CreditSource | RedeemSource;

export class TransactionFilterDto {
  @IsEnum(TransactionStatus)
  @IsOptional()
  status: TransactionStatus;

  @IsEnum(TransactionRange)
  @IsOptional()
  range: TransactionRange;
}

export class TransactionItem {
  isHeader: boolean;
  month: string;
  type: 'credited' | 'redeemed' | 'pending' | 'converted' | 'expired';
  points: number;
  source: TransactionSource;
  date: Date;
  orderId: string;
  customerName: string;
  couponCode: string;
  thirdPartyPlatformName: string;
  ruleName: string;
}

export class TransactionsResponse extends Paginated<TransactionItem> {}

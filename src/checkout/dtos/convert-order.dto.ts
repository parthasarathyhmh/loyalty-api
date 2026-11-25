import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ConvertOrder {
  @IsString()
  @IsNotEmpty()
  clientId: string;

  @IsString()
  @IsOptional()
  cartId?: string;

  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsOptional()
  magentoOrderId?: string;
}

import { Type } from 'class-transformer';
import { IsString, ValidateNested } from 'class-validator';
import { Cart } from './cart.dto';
import { Order } from './order.dto';

export class PreviewDto {
  @IsString()
  clientId: string;

  @IsString()
  userId: string;

  @ValidateNested()
  @Type(() => Cart)
  cart: Cart;
}

export class ApplyDto {
  @IsString()
  clientId: string;

  @IsString()
  userId: string;

  @IsString()
  orderId: string;

  @ValidateNested()
  @Type(() => Order)
  order: Order;
}

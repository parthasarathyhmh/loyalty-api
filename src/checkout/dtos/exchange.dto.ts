import { IsNumber, IsPositive, IsString } from 'class-validator';

export class ExchangeOption {
  enabled: boolean;
  discount: number;
  points: number;
}

export class RedeemExchange {
  @IsString()
  clientId: string;

  @IsString()
  userId: string;

  @IsString()
  cartId: string;

  @IsNumber()
  @IsPositive()
  discount: number;

  @IsNumber()
  @IsPositive()
  points: number;
}

export class RevertExchange {
  @IsString()
  clientId: string;

  @IsString()
  userId: string;

  @IsString()
  cartId: string;
}

export class ExchangeResponse {
  pointsBalance: number;
  options: ExchangeOption[];
}

export class RedeemExchangeResponse {
  pointsBalance: number;
  discount: number;
  points: number;
}

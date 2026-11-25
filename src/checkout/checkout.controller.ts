import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  Consumer,
  ConsumerType,
} from '../common/decorators/consumer.decorator';
import { User } from '../common/decorators/user.decorator';
import { AuthGuard } from '../common/guards/auth.guard';
import { MachineGuard } from '../common/guards/machine.guard';
import { UserEntity } from '../common/interfaces/user';
import { CheckoutService } from './checkout.service';
import { ConvertOrder } from './dtos/convert-order.dto';
import {
  ExchangeResponse,
  RedeemExchange,
  RedeemExchangeResponse,
  RevertExchange,
} from './dtos/exchange.dto';

@Controller('checkout')
export class CheckoutController {
  constructor(private readonly service: CheckoutService) {}

  @Get('exchanges')
  @UseGuards(AuthGuard)
  async listExchanges(@User() user: UserEntity): Promise<ExchangeResponse> {
    return this.service.listExchanges(user);
  }

  @Post('redeem')
  @Consumer(ConsumerType.HSF_MX)
  @UseGuards(MachineGuard)
  async redeemExchange(
    @Body() exchange: RedeemExchange,
  ): Promise<RedeemExchangeResponse> {
    return this.service.redeemExchange(exchange);
  }

  @Post('order')
  @Consumer(ConsumerType.HSF_MX)
  @UseGuards(MachineGuard)
  async convertToOrder(@Body() update: ConvertOrder) {
    return this.service.convertToOrder(update);
  }

  @Post('revert')
  @Consumer(ConsumerType.HSF_MX)
  @UseGuards(MachineGuard)
  async revertExchange(@Body() exchange: RevertExchange): Promise<void> {
    return this.service.revertExchange(exchange);
  }
}

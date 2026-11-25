import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../common/entities/customer.entity';
import { ExchangeRate } from '../common/entities/exchange.entity';
import { Project } from '../common/entities/project.entity';
import { Tier } from '../common/entities/tier.entity';
import { AccountService } from '../common/services/accounts.service';
import { PointService } from '../common/services/points.service';
import { ProjectConfig } from '../common/services/project-config.service';
import { Client } from '../user/entities/client.entity';
import { PointTransaction } from '../wallet/entities/point-transaction.entity';
import { PointUsage } from '../wallet/entities/point-usage.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { CheckoutController } from './checkout.controller';
import { CheckoutService } from './checkout.service';
import { CheckoutTransaction } from './entities/checkout-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Client,
      Customer,
      Tier,
      ExchangeRate,
      Wallet,
      CheckoutTransaction,
      PointTransaction,
      PointUsage,
      Project,
    ]),
  ],
  controllers: [CheckoutController],
  providers: [CheckoutService, PointService, ProjectConfig, AccountService],
})
export class CheckoutModule {}

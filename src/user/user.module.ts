import { ExchangeRate } from '@/common/entities/exchange.entity';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../common/entities/customer.entity';
import { Project } from '../common/entities/project.entity';
import { Tier } from '../common/entities/tier.entity';
import { AccountService } from '../common/services/accounts.service';
import HttpService from '../common/services/http.service';
import { ProjectConfig } from '../common/services/project-config.service';
import { Wallet } from '../wallet/entities/wallet.entity';
import { Client } from './entities/client.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TierConfig } from '@/common/entities/tier-config.entity';
import { TierProcessor } from '@/rules/processors/tier.processor';
import { PointService } from '@/common/services/points.service';
import { PointUsage } from '@/wallet/entities/point-usage.entity';

@Module({
  imports: [
    JwtModule.register({ global: true }),
    TypeOrmModule.forFeature([
      Wallet,
      Client,
      Customer,
      Tier,
      ExchangeRate,
      Project,
      TierConfig,
      PointUsage
    ]),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    HttpService,
    ProjectConfig,
    AccountService,
    TierProcessor,
    PointService
  ],
})
export class UserModule {}

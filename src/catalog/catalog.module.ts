import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardCatalogueEntity } from '../common/entities/catalog.entity';
import { RewardsCategory } from '../common/entities/category.entity';
import { Coupon } from '../common/entities/coupon.entity';
import { Customer } from '../common/entities/customer.entity';
import { Project } from '../common/entities/project.entity';
import { AccountService } from '../common/services/accounts.service';
import HttpService from '../common/services/http.service';
import { PointService } from '../common/services/points.service';
import { ProjectConfig } from '../common/services/project-config.service';
import { Client } from '../user/entities/client.entity';
import { PointTransaction } from '../wallet/entities/point-transaction.entity';
import { PointUsage } from '../wallet/entities/point-usage.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { CustomerReward } from './entities/customer-reward.entity';
import { RewardTransaction } from './entities/reward-transaction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Client,
      RewardCatalogueEntity,
      RewardsCategory,
      Customer,
      RewardTransaction,
      CustomerReward,
      Wallet,
      Coupon,
      PointUsage,
      PointTransaction,
      Project,
    ]),
  ],
  controllers: [CatalogController],
  providers: [
    CatalogService,
    HttpService,
    PointService,
    ProjectConfig,
    AccountService,
  ],
})
export class CatalogModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomerReward } from '../catalog/entities/customer-reward.entity';
import { RewardTransaction } from '../catalog/entities/reward-transaction.entity';
import { Project } from '../common/entities/project.entity';
import { AccountService } from '../common/services/accounts.service';
import { ProjectConfig } from '../common/services/project-config.service';
import { Client } from '../user/entities/client.entity';
import { Wallet } from './entities/wallet.entity';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { Customer } from '@/common/entities/customer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Client,
      CustomerReward,
      RewardTransaction,
      Wallet,
      Project,
      Customer
    ]),
  ],
  controllers: [WalletController],
  providers: [WalletService, ProjectConfig, AccountService],
})
export class WalletModule {}

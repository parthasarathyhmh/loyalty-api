import { Invoice } from '@/common/entities/invoice.entity';
import { Milestonethroughput } from '@/common/entities/milestonethroughput.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../common/entities/customer.entity';
import { DateEntity } from '../common/entities/date.entity';
import { Rule } from '../common/entities/rules.entity';
import { Tier } from '../common/entities/tier.entity';
import { AccountService } from '../common/services/accounts.service';
import HttpService from '../common/services/http.service';
import { PointService } from '../common/services/points.service';
import { AttributeService } from '../rules/attribute.service';
import { RulesSnapshot } from '../rules/entities/rule-snapshot.entity';
import { ThroughputTransaction } from '../rules/entities/throughput-transactions.entity';
import { DataProcessor } from '../rules/processors/data.processor';
import { Client } from '../user/entities/client.entity';
import { PointUsage } from '../wallet/entities/point-usage.entity';
import { Wallet } from '../wallet/entities/wallet.entity';
import { MilestoneController } from './milestone.controller';
import { MilestoneService } from './milestone.service';
import { ProjectConfig } from '@/common/services/project-config.service';
import { Project } from '@/common/entities/project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Client,
      Rule,
      DateEntity,
      Customer,
      Wallet,
      Tier,
      RulesSnapshot,
      Invoice,
      Milestonethroughput,
      ThroughputTransaction,
      PointUsage,
      Project
    ]),
  ],
  controllers: [MilestoneController],
  providers: [
    MilestoneService,
    DataProcessor,
    AttributeService,
    HttpService,
    PointService,
    AccountService,
    ProjectConfig,
  ],
})
export class MilestoneModule {}

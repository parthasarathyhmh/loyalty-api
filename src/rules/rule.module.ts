import { CheckoutTransaction } from '@/checkout/entities/checkout-transaction.entity';
import { Customer } from '@/common/entities/customer.entity';
import { DateEntity } from '@/common/entities/date.entity';
import { Invoice } from '@/common/entities/invoice.entity';
import { Milestonethroughput } from '@/common/entities/milestonethroughput.entity';
import { Project } from '@/common/entities/project.entity';
import { Rule } from '@/common/entities/rules.entity';
import { TierConfig } from '@/common/entities/tier-config.entity';
import { Tier } from '@/common/entities/tier.entity';
import { Reason } from '@/common/entities/transaction-reason.entity';
import { PointService } from '@/common/services/points.service';
import { QueueService } from '@/queue/queue.service';
import { MilestoneTransaction } from '@/rules/entities/milestone-transactions.entity';
import { Client } from '@/user/entities/client.entity';
import { PointTransaction } from '@/wallet/entities/point-transaction.entity';
import { PointUsage } from '@/wallet/entities/point-usage.entity';
import { Point } from '@/wallet/entities/point.entity';
import { Wallet } from '@/wallet/entities/wallet.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExchangeRate } from '../common/entities/exchange.entity';
import { AccountService } from '../common/services/accounts.service';
import HttpService from '../common/services/http.service';
import { ProjectConfig } from '../common/services/project-config.service';
import { AttributeService } from './attribute.service';
import { CartTransaction } from './entities/cart-transactions.entity';
import { RulesSnapshot } from './entities/rule-snapshot.entity';
import { ThroughputTransaction } from './entities/throughput-transactions.entity';
import { ActionProcessor } from './processors/actions.processor';
import { ConditionProcessor } from './processors/conditions.processor';
import { ConstraintProcessor } from './processors/constraints.processor';
import { DataProcessor } from './processors/data.processor';
import { ExchangeProcessor } from './processors/exchange.processor';
import { TransactionProcessor } from './processors/transaction.processor';
import { RuleController } from './rule.controller';
import { RuleService } from './rule.service';
import { TierService } from './tier.service';
import { Customermeta } from '@/common/entities/customer-meta.entity';
import { TierProcessor } from './processors/tier.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Client,
      Rule,
      DateEntity,
      Wallet,
      Customer,
      Tier,
      TierConfig,
      PointUsage,
      Project,
      ExchangeRate,
      MilestoneTransaction,
      Reason,
      Point,
      PointTransaction,
      Invoice,
      CartTransaction,
      RulesSnapshot,
      Milestonethroughput,
      ThroughputTransaction,
      CheckoutTransaction,
      Customermeta
    ]),
  ],
  controllers: [RuleController],
  providers: [
    RuleService,
    AttributeService,
    ActionProcessor,
    ConditionProcessor,
    ConstraintProcessor,
    DataProcessor,
    ExchangeProcessor,
    TransactionProcessor,
    TierProcessor,
    TierService,
    PointService,
    HttpService,
    QueueService,
    ProjectConfig,
    AccountService,
  ],
})
export class RuleModule {}

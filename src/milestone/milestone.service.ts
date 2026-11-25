import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DateTime } from 'luxon';
import {
  DataSource,
  LessThanOrEqual,
  Like,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Customer } from '../common/entities/customer.entity';
import { Milestonethroughput } from '../common/entities/milestonethroughput.entity';
import { Rule, RuleType } from '../common/entities/rules.entity';
import { Tier } from '../common/entities/tier.entity';
import { numeric } from '../common/functions/numeric';
import { UserEntity } from '../common/interfaces/user';
import { AccountService } from '../common/services/accounts.service';
import { PointService } from '../common/services/points.service';
import { AttributeService } from '../rules/attribute.service';
import { DataProcessor } from '../rules/processors/data.processor';
import { Client } from '../user/entities/client.entity';
import { MilestoneItem, MilestoneResponse } from './dtos/milestone.dto';

@Injectable()
export class MilestoneService {
  constructor(
    @InjectRepository(Client)
    private readonly clients: Repository<Client>,
    @InjectRepository(Rule)
    private readonly rules: Repository<Rule>,
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
    @InjectRepository(Tier)
    private readonly tiers: Repository<Tier>,
    @InjectRepository(Milestonethroughput)
    private readonly throughputs: Repository<Milestonethroughput>,
    private readonly data: DataProcessor,
    private readonly attributes: AttributeService,
    private readonly ds: DataSource,
    private readonly ps: PointService,
    private readonly acc: AccountService,
  ) {}

  async listMilestones(user: UserEntity): Promise<MilestoneResponse> {
    const client = await this.clients.findOneBy({ id: user.client_id });
    if (!client) throw new NotFoundException('client not found');

    const [customer, walletIds] = await Promise.all([
      this.customers.findOneBy({
        customerId: Number(user.user_id),
      }),
      this.acc.getWalletIds(client.projectId, user),
    ]);

    const tier = await this.tiers.findOneBy({ id: customer.tierId });

    const rules = await this.rules.find({
      where: {
        project: { id: client.projectId },
        ruleType: RuleType.Milestone,
        isActive: true,
      },
    });

    let maxPointAll = 0;
    let maxPointEarned = 0;

    const completed = [];
    const incomplete = [];
    const active = [];

    for (const rule of rules) {
      const startDate = rule.activeFrom;
      const expiryDate = rule.activeTo;

      const usage = await this.data.getUsageFromInvoice(
        startDate,
        expiryDate,
        customer.retailerCode,
      );

      const condition = rule.conditions.find((condition) =>
        [
          'SKU',
          'Category',
          'Total points earned',
          'Total points spent',
        ].includes(condition.attribute),
      );

      if (!condition) {
        console.warn({
          message: 'Skipping rule as there are no top level valid filters',
          id: rule.id,
        });
        continue;
      }

      const conditionValue = Number.parseInt(condition.value);
      if (Number.isNaN(conditionValue) && condition.attribute === 'SKU') {
        console.warn({
          message: 'Skipping milestone rule due to invalid value for sku',
          id: rule.id,
          value: condition.value,
        });
        continue;
      }

      const tierAction = rule.actions.find(
        (action) => action.customerTier === tier?.name,
      );

      if (!tierAction) {
        console.warn({
          message:
            'Skipping milestone rule as rule in not applicable for current tier',
          id: rule.id,
          tier: tier?.name,
        });
        continue;
      }
      const earning = tierAction.points;

      maxPointAll += earning;

      let conditionProgress = 0;
      let inprogress = 0;
      let total = 0;
      if (
        condition?.conditions.length &&
        ['SKU', 'Category'].includes(condition.attribute)
      ) {
        const firstSubCondition = condition.conditions[0];
        const currentValue = this.attributes.getValueForMilestone(
          firstSubCondition.attribute,
          condition.attribute,
          condition.value,
          usage,
        );

        const subConditionValue = Number.parseFloat(firstSubCondition.value);
        if (Number.isNaN(subConditionValue)) {
          console.warn({
            message: 'Skipping milestone subcondtion due to invalid value',
            value: firstSubCondition.value,
            id: rule.id,
          });
          continue;
        }
        if (!total || !inprogress) {
          total = subConditionValue;
          inprogress = currentValue;
        }

        conditionProgress = Math.min(
          (currentValue * 100) / subConditionValue,
          100,
        );
      } else if (
        ['Total points earned', 'Total points spent'].includes(
          condition.attribute,
        )
      ) {
        const isEarned = 'Total points earned' === condition.attribute;
        const currentPoints = isEarned
          ? await this.ps.getEarnedSince(
              this.ds,
              walletIds,
              startDate,
              expiryDate,
            )
          : await this.ps.getSpentSince(
              this.ds,
              walletIds,
              startDate,
              expiryDate,
            );

        total = conditionValue;
        inprogress = currentPoints;

        conditionProgress = Math.min(
          (currentPoints * 100) / conditionValue,
          100,
        );
      }

      const currentPoints = (earning * conditionProgress) / 100;

      const commonData = {
        title: rule.displayName,
        description: rule.description,
        points: earning,
        expiry: expiryDate,
      };
      if (currentPoints === earning) {
        maxPointEarned += currentPoints;
        completed.push({
          ...commonData,
          progress: { inprogress, total },
        });
      } else if (currentPoints > 0) {
        maxPointEarned += currentPoints;
        active.push({
          ...commonData,
          progress: { inprogress, total },
        });
      } else {
        incomplete.push({
          ...commonData,
          progress: { inprogress: 0, total },
        });
      }
    }

    const throughputs = await this.throughputs.find({
      where: {
        isActive: true,
        project: { id: client.projectId },
        soldTo: Like(`%${customer.retailerCode.replace(/^0+/, '')}`),
        startDate: LessThanOrEqual(DateTime.now().startOf('day').toJSDate()),
        endDate: MoreThanOrEqual(DateTime.now().toJSDate()),
      },
      order: {
        createdAt: 'DESC',
      },
    });

    for (const throughput of throughputs) {
      console.log({
        message: 'evaluating throughput rule',
        ruleId: throughput?.id,
      });

      if (throughput) {
        const currentSales = await this.data.getSalesForRetailer(
          customer.retailerCode,
          throughput.startDate,
          throughput.endDate,
        );
        const targetSales =
          numeric(throughput.baseValue) +
          (numeric(throughput.baseValue) *
            numeric(throughput.percentageGrowth)) /
            100;
        const commonData: Partial<MilestoneItem> = {
          title: throughput.name,
          description: throughput.name,
          points: 0,
          expiry: throughput.endDate,
          throughput: true,
        };

        console.log({
          message: 'evaluating sale',
          ruleId: throughput?.id,
          currentSales,
          targetSales,
        });

        if (currentSales >= targetSales) {
          completed.push({
            ...commonData,
            progress: { inprogress: currentSales, total: targetSales },
          });
        } else if (currentSales > 0) {
          active.push({
            ...commonData,
            progress: { inprogress: currentSales, total: targetSales },
          });
        } else {
          incomplete.push({
            ...commonData,
            progress: { inprogress: currentSales, total: targetSales },
          });
        }
      }
    }

    const totalMilestones =
      active.length + completed.length + incomplete.length;

    return {
      points: {
        inprogress: maxPointEarned,
        total: maxPointAll,
      },
      milestones: {
        inprogress: completed.length,
        total: totalMilestones,
      },
      completed,
      active,
      incomplete,
    };
  }
}

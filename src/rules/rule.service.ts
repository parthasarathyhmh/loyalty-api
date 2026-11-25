import { TransactionSource } from '@/wallet/entities/point-transaction.entity';
import { BadRequestException, Injectable } from '@nestjs/common';
import { Direction } from '../common/entities/exchange.entity';
import { Rule, RuleType } from '../common/entities/rules.entity';
import { AccountService } from '../common/services/accounts.service';
import { ApplyDto, PreviewDto } from './dtos/client.dto';
import { Preview, RulePreview } from './dtos/preview.dto';
import { RulesSnapshot } from './entities/rule-snapshot.entity';
import { ActionProcessor } from './processors/actions.processor';
import { ConditionProcessor } from './processors/conditions.processor';
import { ConstraintProcessor } from './processors/constraints.processor';
import { DataProcessor, RuleData } from './processors/data.processor';
import { ExchangeProcessor } from './processors/exchange.processor';
import { TransactionProcessor } from './processors/transaction.processor';

@Injectable()
export class RuleService {
  constructor(
    private readonly actions: ActionProcessor,
    private readonly conditions: ConditionProcessor,
    private readonly constraints: ConstraintProcessor,
    private readonly data: DataProcessor,
    private readonly exchange: ExchangeProcessor,
    private readonly transaction: TransactionProcessor,
    private readonly acc: AccountService,
  ) {}

  async evaluateCartRule(body: PreviewDto): Promise<Preview> {
    const data = await this.data.buildWithCart(
      body.clientId,
      body.userId,
      body.cart,
    );
    console.log('Built data with cart:', data.customer);

    const activeRules = await this.data.findActiveCartRules(
      data.client.projectId,
    );
    console.log('Active cart rules found:', activeRules);

    const { preview } = await this.evaluateRules(activeRules, data);
    console.log('Preview from evaluateRules:', preview);

    return preview;
  }

  async applyCartRule(body: ApplyDto): Promise<number> {
    const data = await this.data.buildWithOrder(
      body.clientId,
      body.userId,
      body.order,
      body.orderId,
    );
    const activeRules = await this.data.findActiveCartRules(
      data.client.projectId,
    );
    if (!activeRules.length) throw new BadRequestException('No active rules');

    const { rules, points, preview } = await this.evaluateRules(
      activeRules,
      data,
    );

    if (points > 0) {
      const transactionPayload = this.transaction.buildTransactionItem(
        data,
        points,
        TransactionSource.Cart,
      );

      await this.transaction.performTransaction(
        transactionPayload,
        TransactionSource.Cart,
      );

      const snapshotPayload: RuleData = {
        ...data,
        rules,
        preview,
      };
      await this.data.saveRuleSnapshot(snapshotPayload);
    }
    return points;
  }

  async evaluateMilestoneRule(): Promise<void> {
    const [milestoneRules, wallets] = await Promise.all([
      this.data.findActiveMilestoneRules(),
      this.data.findActiveWallet(),
    ]);
    if (!milestoneRules.length) {
      console.warn('No active milestone rule');
      return;
    }
    if (!wallets.length) {
      console.warn('No active wallets');
      return;
    }

    for (const wallet of wallets) {
      const data = await this.data.buildByWallet(wallet);

      const { rules } = await this.evaluateRules(milestoneRules, data, false);

      for (const rule of rules) {
        const isProcessed = await this.transaction.isMilestoneProcessed(
          rule.id,
        );
        if (isProcessed) continue;

        const creditPoints = this.actions.apply(rule, data);

        console.log({
          type: 'info',
          context: 'milestone',
          creditPoints,
          ruleId: rule.id,
        });

        if (creditPoints) {
          const transactionPayload = this.transaction.buildTransactionItem(
            data,
            creditPoints,
            TransactionSource.Milestone,
            rule.id,
          );

          await this.transaction.performTransaction(
            transactionPayload,
            TransactionSource.Milestone,
          );
        }
      }
    }
  }
  async evaluateThroughputRule(): Promise<void> {
    console.log('Starting throughput rule evaluation...');

    const throughputs = await this.data.findActiveThroughputRules();
    if (!throughputs.length) {
      console.log('No active throughput rules found.');
      return;
    }

    for (const throughput of throughputs) {
      const throughputId = throughput.id;

      if (throughput.endDate < new Date()) {
        const isProcessed =
          await this.transaction.isThroughputProcessed(throughputId);
        if (isProcessed) continue;

        const data = await this.data.buildByThroughput(throughput);
        if (data?.usage && data.customer && data.wallet) {
          const creditPoints = this.actions.calculateThroughputPoints({
            baseValue: throughput.baseValue,
            percentageGrowth: throughput.percentageGrowth,
            valueToPoints: throughput.valueToPoints,
            salesValue: data.usage.orders.sales,
          });

          if (creditPoints) {
            const transactionPayload = this.transaction.buildTransactionItem(
              data,
              creditPoints,
              TransactionSource.Throughput,
              throughputId,
            );
            await this.transaction.performTransaction(
              transactionPayload,
              TransactionSource.Throughput,
            );
            console.log(
              `Transaction completed for throughput rule ID: ${throughputId}.`,
            );
          }
        }
      }
    }

    console.log('Throughput rule evaluation completed.');
  }

  async processInvoicesDaily(): Promise<void> {
    try {
      const invoices = await this.data.getNetInvoices();
      console.log(`Fetched ${invoices.length} invoices.`);
      console.log('Fetched invoices:', invoices);
      for (const invoice of invoices) {
        try {
          const ruleSnapshot: RulesSnapshot =
            await this.data.findRuleSnapshotByMgtOrderId(
              invoice.purchaseOrderNumber,
            );

          if (!ruleSnapshot) {
            // console.log(
            //   `No rule snapshot found for purchaseOrderNumber: ${invoice.purchaseOrderNumber}, skipping.`,
            // );
            continue;
          }

          const { rules: activeRules, ...data } =
            await this.data.buildOrderRuleEvaluation(
              ruleSnapshot,
              invoice.items,
            );
          const { points } = await this.evaluateRules(activeRules, data);

          // TODO: If points are 0, delete credited points altogether

  
          const { wallet, walletIds } = await this.acc.getDetails(
            data.customer.customerId.toString(),
            data.wallet.projectId,
          );

          await this.transaction.performInvoiceTransaction({
            points,
            orderId: data.orderId,
            phone: data.customer.mobile,
            walletIds,
            wallet
          });
          console.log(
            `Success: Transaction completed for orderId: ${data.orderId}`,
          );
        } catch (invoiceError) {
          console.error(
            `Error processing invoice with purchaseOrderNumber: ${invoice.purchaseOrderNumber}`,
            invoiceError,
          );
        }
      }
    } catch (error) {
      console.error('Error in processInvoicesDaily:', error);
    }
    console.log('Completed Process Invoices Daily.');
  }

  private async calculateRulePoints(
    rules: Rule[],
    data: RuleData,
  ): Promise<{ total: number; pointsByRule: RulePreview[] }> {
    let total = 0;
    const pointsByRule: RulePreview[] = [];

    for (const rule of rules) {
      const points = this.actions.apply(rule, data);
      if (points > 0) {
        total += points;
        pointsByRule.push({
          id: rule.id,
          name: rule.displayName,
          value: points,
        });
      }
    }

    return { total, pointsByRule };
  }

  async evaluateRules(
    rules: Rule[],
    data: RuleData,
    calculatePoints = true,
  ): Promise<{ rules: Rule[]; points: number; preview: Preview }> {
    const preview: Preview = {
      total: 0,
      standard: 0,
      rules: [],
    };

    let exchangePoints = 0;
    let rulePoints = 0;
    const validRules: Rule[] = [];

    if (calculatePoints) {
      const currentExchange = await this.exchange.findCurrentRate(
        data,
        Direction.POINTS_TO_CURRENCY,
      );
      if (
        currentExchange &&
        data?.customer?.customerMeta?.isEligibleForLoyalty
      ) {
        data.exchange = currentExchange;
        exchangePoints = await this.exchange.calculatePoints(data);
        preview.standard = exchangePoints;
      }
    }

    if (rules.length) {
      console.log({ message: 'processing rules', length: rules.length });
      const sortedRules = rules.sort((a, b) => a.priority - b.priority);
      for (const rule of sortedRules) {
        // should be active
        if (!rule.isActive) {
          console.warn({
            message: 'skipping due to inactive rule',
            id: rule.id,
          });

          continue;
        }

        // should have valid date range
        const hasValidDate = await this.hasValidRuleDate(rule);
        if (!hasValidDate) {
          console.warn({
            message: 'skipping due to invaild date for rule',
            id: rule.id,
          });
          continue;
        }

        // should fulfil constraints
        if (
          !rule.conditions.every((condition) =>
            this.constraints.enforce(rule.ruleType, condition),
          )
        ) {
          console.warn({
            message: 'skipping due to invaild constraints',
            id: rule.id,
          });
          continue;
        }

        // no actions are defined
        if (!rule.actions.length) {
          console.warn({
            message: 'skipping rule due to missing actions',
            id: rule.id,
          });
          continue;
        }
        // no actions are configured for current tier
        if (
          !rule.actions.some(
            (action) =>
              action.customerTier.toLowerCase() ===
              data.tier.name.toLowerCase(),
          )
        ) {
          console.warn({
            message: 'skipping due to missing actions for tier',
            id: rule.id,
            tier: data.tier?.name,
          });
          continue;
        }

        // if it's a milestone rule and there is no usage data, populate it
        if (rule.ruleType === RuleType.Milestone && !data.usage) {
          data.usage = await this.data.getUsageFromInvoice(
            rule.activeFrom,
            rule.activeTo,
            data.customer.retailerCode,
          );
        }
        try {
          // condition evaluation
          const hasValidConditions = this.conditions.evaluate(
            rule.conditions,
            data,
          );
          if (!hasValidConditions) {
            console.warn({
              message: 'skipping due to failed conditions',
              id: rule.id,
              conditions: rule.conditions,
            });
            continue;
          }
        } catch (e) {
          console.warn(e);
          continue;
        }

        // push rule to valid ones
        validRules.push(rule);

        // if discard subsequent is enabled and it's a cart rule, break
        if (rule.ruleType === RuleType.Cart && rule.discardSubsequentRules)
          break;
      }
    }

    let totalPoints = 0;

    if (calculatePoints) {
      if (
        validRules?.length &&
        data?.customer?.customerMeta?.isEligibleForLoyalty
      ) {
        const { total, pointsByRule } = await this.calculateRulePoints(
          validRules,
          data,
        );
        rulePoints = total;
        preview.rules = pointsByRule;
      }

      console.log({
        message: 'points calculated',
        points: rulePoints,
        exchange: exchangePoints,
        validRules: validRules?.length,
      });
    }

    totalPoints = rulePoints + exchangePoints;
    if (data?.customer?.customerMeta?.isEligibleForLoyalty) {
      preview.total = totalPoints;
    }
    console.log('evaluate Rules Points:', {
      rules: validRules,
      points: Math.round(totalPoints),
      preview,
    });
    return {
      rules: validRules,
      points: Math.round(totalPoints),
      preview,
    };
  }

  private async hasValidRuleDate(rule: Rule): Promise<boolean> {
    const now = new Date();
    if (rule.timePeriod.toLocaleLowerCase() === 'custom') {
      if (
        !rule.activeFrom ||
        !rule.activeTo ||
        now < rule.activeFrom ||
        now > rule.activeTo
      ) {
        return false;
      }
    } else {
      const timePeriod = await this.data.findTimePeriod(rule.timePeriod);
      if (!timePeriod || now < timePeriod.fromDate || now > timePeriod.toDate) {
        return false;
      }
    }
    return true;
  }
}

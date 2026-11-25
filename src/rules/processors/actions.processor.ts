import { BadRequestException, Injectable } from '@nestjs/common';
import {
  ActionDto,
  BehaviorRuleActionDto,
  CartRuleActionDto,
  EarningStyle,
  MilestoneRuleActionDto,
  Rule,
  RuleType,
} from '../../common/entities/rules.entity';
import { RuleData } from './data.processor';

@Injectable()
export class ActionProcessor {
  apply(rule: Rule, { tier, cart, order }: RuleData): number {
    console.log('[APPLY_POINTS] Rule Data:', { tier, cart, order });

    // Tier action not configured
    if (!Array.isArray(rule.actions)) {
      console.log('[APPLY_POINTS] No actions configured for rule.');
      return;
    }

    const action = rule.actions.find(
      (a: ActionDto) => a.customerTier === tier.name,
    );

    if (!action) {
      console.log(`[APPLY_POINTS] No action found for tier: ${tier.name}`);
      return;
    }

    const calculationInput =
      cart || order
        ? {
            spent:
              cart?.prices?.subtotal_excluding_tax?.value ??
              order?.order_summary?.subtotal_excluding_tax?.value,
            quantity:
              cart?.total_quantity ??
              order?.items
                ?.filter((item) => item.type !== 'free')
                ?.reduce((total, item) => total + item.cart_item_quantity, 0),
          }
        : undefined;

    console.log('[APPLY_POINTS] Calculation input:', calculationInput);

    const pointsToCredit = this.calculatePoints(
      rule.ruleType,
      action,
      calculationInput,
    );

    console.log('[APPLY_POINTS] Points to credit:', pointsToCredit);

    return pointsToCredit;
  }

  calculatePoints(
    ruleType: RuleType,
    actions: ActionDto,
    data?: { spent: number; quantity: number },
  ): number {
    if (ruleType !== RuleType.Milestone && !data) {
      throw new BadRequestException('cart data is required');
    }

    console.log({ message: 'calculating points...', ruleType, actions, data });

    switch (ruleType) {
      case RuleType.Cart:
        return this.calculateCartPoints(actions, data);
      case RuleType.Behavior:
        return this.calculateBehaviorPoints(actions, data);
      case RuleType.Milestone:
        return this.calculateMilestonePoints(actions);
      default:
        throw new BadRequestException(`Unsupported rule type: ${ruleType}`);
    }
  }

  private calculateCartPoints(
    action: CartRuleActionDto,
    data: { spent: number; quantity: number },
  ): number {
    let result = 0;
    switch (action.earningStyle.value) {
      case EarningStyle.GiveX:
        result = action.points;
        break;
      case EarningStyle.GiveNX:
        result = action.points * (action.multiplier || 1);
        break;
      case EarningStyle.GiveXForYSpent:
        result = Math.floor(data.spent / (action.steps || 1)) * action.points;
        break;
      case EarningStyle.GiveXForZQty:
        result =
          Math.floor(data.quantity / (action.quantity || 1)) * action.points;
        break;
      default:
        throw new BadRequestException(`Invalid action for cart: ${action}`);
    }
    return action.max ? Math.min(action.max, result) : result;
  }

  private calculateBehaviorPoints(
    action: BehaviorRuleActionDto,
    data: { spent: number; quantity: number },
  ): number {
    switch (action.earningStyle.value) {
      case EarningStyle.GiveX:
        return action.points;
      case EarningStyle.GiveXForYSpent:
        return Math.floor(data.spent / (action.steps || 1)) * action.points;
      case EarningStyle.GiveXForZQty:
        return (
          Math.floor(data.quantity / (action.quantity || 1)) * action.points
        );
      default:
        throw new BadRequestException(`Invalid action for behavior: ${action}`);
    }
  }

  private calculateMilestonePoints(action: MilestoneRuleActionDto): number {
    if (action.earningStyle.value === EarningStyle.GiveXOnComplete) {
      return action.points;
    }
    throw new BadRequestException(`Invalid action for milestone: ${action}`);
  }

  calculateThroughputPoints({
    baseValue,
    percentageGrowth,
    valueToPoints,
    salesValue,
  }): number {
    const calculatebaseValueWithGrowth =
      baseValue + (baseValue * percentageGrowth) / 100;
    if (salesValue > calculatebaseValueWithGrowth) {
      return (salesValue * valueToPoints) / 100;
    }
    return 0;
  }
}

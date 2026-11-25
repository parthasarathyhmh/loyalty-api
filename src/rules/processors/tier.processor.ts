import { Injectable } from '@nestjs/common';
import { TierCycle } from '@/common/entities/tier-config.entity';
import { DateTime } from 'luxon';
import {
  ConditionOperator,
  Tier,
  TierConditionAttributes,
  TierConditon,
} from '@/common/entities/tier.entity';

@Injectable()
export class TierProcessor {
  /**
   * Calculates the start date of a cycle based on the specified tier cycle.
   */
  getCycleStartDate(cycle: TierCycle): Date {
    const now = DateTime.now();

    switch (cycle) {
      case TierCycle.Monthly:
        return now.startOf('month').toJSDate();
      case TierCycle.Quarterly:
        return now.startOf('quarter').toJSDate();
      case TierCycle.HalfYearly:
        return DateTime.fromObject({
          year: now.year,
          month: now.month > 6 ? 7 : 1,
          day: 1,
        }).toJSDate();
      case TierCycle.Yearly:
        return now.startOf('year').toJSDate();
      default:
        return now.toJSDate();
    }
  }
  // Retrieves the highest eligible tier for a customer based on points and conditions.
  getNextTier(
    tiers: Tier[],
    totalPoints: { earned: number; spent: number },
  ): Tier | null {
    console.log('[NEXT_TIER] Received tiers:', tiers);
    console.log('[NEXT_TIER] Total points:', totalPoints);

    const validFilteredTiers = tiers.filter((tier) =>
      this.evaluateTierConditions(tier.conditions, totalPoints),
    );
    console.log(
      '[NEXT_TIER] Valid filtered tiers:',
      validFilteredTiers.map((tier) => tier.name),
    );

    const validSortedTiers = validFilteredTiers.sort(
      (a, b) => this.getTierRank(b.conditions) - this.getTierRank(a.conditions),
    );
    console.log(
      '[NEXT_TIER] Valid sorted tiers:',
      validSortedTiers.map((tier) => tier.name),
    );

    const nextTier = validSortedTiers.shift() || null;
    console.log('[NEXT_TIER] Selected next tier:', nextTier?.name || 'null');

    return nextTier;
  }

  // Determines the rank of a tier by evaluating the maximum condition value.
  getTierRank(conditions: TierConditon[]): number {
    if (conditions.length === 1) {
      if (
        [
          ConditionOperator.lessthan,
          ConditionOperator.lessthanorequal,
        ].includes(conditions[0].operator)
      ) {
        return 0;
      } else if (
        [
          ConditionOperator.greaterthanorequal,
          ConditionOperator.greaterthan,
        ].includes(conditions[0].operator)
      ) {
        return conditions[0].operator === ConditionOperator.greaterthanorequal
          ? conditions[0].value
          : conditions[0].value + 1;
      }
    }
    if (conditions.length === 2) {
      const leastOne = conditions.find((condition) =>
        [
          ConditionOperator.greaterthanorequal,
          ConditionOperator.greaterthan,
        ].includes(condition.operator),
      );

      if (leastOne) {
        return leastOne.operator === ConditionOperator.greaterthanorequal
          ? leastOne.value
          : leastOne.value + 1;
      }
    }

    return conditions.length > 0
      ? Math.max(...conditions.map((condition) => condition.value))
      : -1;
  }

  evaluateTierConditions(
    conditions: TierConditon[],
    totalPoints: { earned: number; spent: number },
  ): boolean {
    return conditions.every((condition) =>
      this.evaluateCondition(condition, totalPoints),
    );
  }

  evaluateCondition(
    condition: TierConditon,
    totalPoints: { earned: number; spent: number },
  ): boolean {
    const { attribute, operator, value } = condition;

    const compareValue =
      attribute === TierConditionAttributes.TotalPointsEarned
        ? totalPoints.earned
        : totalPoints.spent;

    switch (operator) {
      case ConditionOperator.equal:
        return compareValue === value;
      case ConditionOperator.notequal:
        return compareValue !== value;
      case ConditionOperator.greaterthan:
        return compareValue > value;
      case ConditionOperator.greaterthanorequal:
        return compareValue >= value;
      case ConditionOperator.lessthan:
        return compareValue < value;
      case ConditionOperator.lessthanorequal:
        return compareValue <= value;
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }
}

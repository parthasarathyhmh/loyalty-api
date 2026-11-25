import { Injectable } from '@nestjs/common';
import { ConditionDto, RuleType } from '../../common/entities/rules.entity';

@Injectable()
export class ConstraintProcessor {
  enforce(ruleType: RuleType, condition: ConditionDto): boolean {
    if (
      ['SKU', 'Brand', 'Category'].includes(condition.attribute) &&
      condition.conditions?.length
    ) {
      if (ruleType === RuleType.Milestone) {
        return condition.conditions.every((nested) =>
          [
            'Total sales (excl. tax)',
            'Total quantity',
            'Total sales (incl. tax)',
          ].includes(nested.attribute),
        );
      }
      if (ruleType === RuleType.Cart) {
        return condition.conditions.every((nested) =>
          [
            'Price in cart',
            'Row total in cart (incl. taxes and discounts)',
            'Quantity in cart',
          ].includes(nested.attribute),
        );
      }
    }
    return true;
  }
}

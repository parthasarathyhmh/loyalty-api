import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CombinationOperator,
  ConditionDto,
  ConditionOperator,
  SubConditionDto,
} from '../../common/entities/rules.entity';
import { AttributeService } from '../attribute.service';
import { RuleData } from './data.processor';

@Injectable()
export class ConditionProcessor {
  constructor(private readonly attributes: AttributeService) {}

  evaluate(conditions: ConditionDto[], data: RuleData): boolean {
    const evaluator = (c: ConditionDto, d: RuleData) =>
      this.deepEvaluateConditions(c, d);
    return this.evaluateConditions(conditions, data, evaluator);
  }

  private evaluateConditions<T extends ConditionDto | SubConditionDto>(
    conditions: T[],
    data: RuleData,
    evaluator: (condition: T, data: RuleData) => boolean,
  ): boolean {
    let result = true;
    for (let i = 0; i < conditions.length; i++) {
      const combinator = conditions[i]?.combinator || CombinationOperator.And;
      const conditionResult = evaluator(conditions[i], data);
      result = this.applyCombinator(combinator, result, conditionResult);
    }
    return result;
  }

  private applyCombinator(
    combinator: CombinationOperator,
    currentResult: boolean,
    newResult: boolean,
  ): boolean {
    if (combinator === CombinationOperator.And)
      return currentResult && newResult;
    if (combinator === CombinationOperator.Or)
      return currentResult || newResult;
    throw new BadRequestException(`Unsupported combinator: ${combinator}`);
  }

  private deepEvaluateConditions(
    condition: ConditionDto,
    data: RuleData,
  ): boolean {
    if (
      this.attributes.isCartSelection(condition.attribute) ||
      this.attributes.isCustomerSelection(condition.attribute)
    ) {
      return false;
    }

    const attributeValue = this.attributes.getValue(condition.attribute, data);
    const parentConditionResult = this.evaluateSingleCondition(
      condition,
      attributeValue,
    );
    const isSelection = this.attributes.isSelection(condition.attribute);
    if (condition?.conditions?.length) {
      const evaluator = (c: SubConditionDto, data: RuleData) =>
        this.evaluateSingleCondition(
          c,
          isSelection
            ? this.attributes.getValueSelection(
                c.attribute,
                condition.attribute,
                condition.value,
                data,
              )
            : this.attributes.getValue(c.attribute, data),
        );

      return (
        parentConditionResult &&
        this.evaluateConditions(condition.conditions, data, evaluator)
      );
    }

    return parentConditionResult;
  }

  private evaluateSingleCondition(
    condition: SubConditionDto | ConditionDto,
    attributeValue: any,
  ): boolean {
    if (Array.isArray(attributeValue)) {
      switch (condition.operator) {
        case ConditionOperator.Equal:
          return attributeValue.includes(condition.value);
        case ConditionOperator.NotEqual:
          return !attributeValue.includes(condition.value);
        case ConditionOperator.In:
          return condition.value.includes(',')
            ? condition.value
                .split(',')
                .some((val) => attributeValue.includes(val))
            : attributeValue.includes(condition.value);
        case ConditionOperator.NotIn:
          return condition.value.includes(',')
            ? condition.value
                .split(',')
                .every((val) => !attributeValue.includes(val))
            : !attributeValue.includes(condition.value);
        default:
          throw new BadRequestException(
            `Invalid operation: ${condition.operator} on an array`,
          );
      }
    }

    if (typeof attributeValue === 'string') {
      switch (condition.operator) {
        case ConditionOperator.Equal:
          return attributeValue === condition.value;
        case ConditionOperator.NotEqual:
          return attributeValue !== condition.value;
        case ConditionOperator.Contains:
          return attributeValue.includes(condition.value);
        case ConditionOperator.DoesNotContains:
          return !attributeValue.includes(condition.value);
        default:
          throw new BadRequestException(
            `Invalid operation: ${condition.operator} on a string`,
          );
      }
    }

    const parsedValue = Number.parseFloat(condition.value);
    const isNumber =
      typeof attributeValue === 'number' && !Number.isNaN(parsedValue);

    const compareValue = ['true', 'false'].includes(condition.value)
      ? condition.value === 'true'
      : Number.isNaN(parsedValue)
        ? condition.value
        : parsedValue;

    if (
      [
        ConditionOperator.LessThan,
        ConditionOperator.GreaterThan,
        ConditionOperator.LessThanOrEqual,
        ConditionOperator.GreaterThanOrEqual,
      ].includes(condition.operator) &&
      !isNumber
    ) {
      throw new BadRequestException(
        `Invalid comparison: ${attributeValue} and ${compareValue} for operator ${condition.operator}`,
      );
    }

    switch (condition.operator) {
      case ConditionOperator.Equal:
        return attributeValue === compareValue;
      case ConditionOperator.NotEqual:
        return attributeValue !== compareValue;
      case ConditionOperator.GreaterThan:
        return attributeValue > compareValue;
      case ConditionOperator.LessThan:
        return attributeValue < compareValue;
      case ConditionOperator.GreaterThanOrEqual:
        return attributeValue >= compareValue;
      case ConditionOperator.LessThanOrEqual:
        return attributeValue <= compareValue;
      default:
        throw new BadRequestException(
          `Unsupported type or operation: ${typeof attributeValue} with operator ${condition.operator}`,
        );
    }
  }
}

import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from './project.entity';

export enum RuleType {
  Cart = 'cart',
  Behavior = 'behavior',
  Milestone = 'milestone',
}

export enum EarningStyle {
  GiveX = 'GiveX',
  GiveXForYSpent = 'GiveXForYSpent',
  GiveXForZQty = 'GiveXForZQty',
  GiveNX = 'GiveNX',
  GiveXOnComplete = 'GiveXOnComplete',
}

export enum CombinationOperator {
  And = 'and',
  Or = 'or',
}

export enum ConditionOperator {
  Equal = '==',
  NotEqual = '!=',
  GreaterThanOrEqual = '>=',
  LessThanOrEqual = '<=',
  GreaterThan = '>',
  LessThan = '<',
  Contains = '{}',
  DoesNotContains = '!{}',
  In = '()',
  NotIn = '!()',
  Undefined = '<=>',
}

export class SubConditionDto {
  attribute: string;
  operator: ConditionOperator;
  value: string;
  combinator?: CombinationOperator;
  order: number;
}

export class ConditionDto {
  attribute: string;
  operator: ConditionOperator;
  value: string;
  combinator?: CombinationOperator;
  order: number;
  conditions?: SubConditionDto[];
}

class BaseRuleActionDto {
  earningStyle: { value: EarningStyle };
  points: number;
  steps?: number;
  quantity?: number;
  max?: number;
  expiry?: number;
  customerTier?: string;
}

export class CartRuleActionDto extends BaseRuleActionDto {
  multiplier?: number;
}

export class BehaviorRuleActionDto extends BaseRuleActionDto {}

export class MilestoneRuleActionDto {
  earningStyle: { value: EarningStyle };
  points: number;
  expiry?: number;
  customerTier?: string;
}

export type ActionDto =
  | CartRuleActionDto
  | MilestoneRuleActionDto
  | BehaviorRuleActionDto;

@Entity('rules')
export class Rule {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Project, (project) => project.id)
  project: Project;

  @Column({ type: 'varchar', length: 64, unique: true })
  ruleName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  displayName: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: RuleType, default: RuleType.Cart })
  ruleType: RuleType;

  @Column({ type: 'bool', default: false })
  isActive: boolean;

  @Column({ type: 'bool', default: false })
  discardSubsequentRules: boolean;

  @Column({ type: 'bool', default: false })
  showOnProductPage: boolean;

  @Column({ type: 'integer', default: 0 })
  priority: number;

  @Column({ type: 'integer', default: 0 })
  maxEarning: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  event?: string;

  @Column({ type: 'jsonb', default: {} })
  conditions: ConditionDto[];

  @Column({ type: 'jsonb', default: {} })
  actions: ActionDto[];

  @Column({ type: 'varchar', length: 64, nullable: true })
  timePeriod?: string; // Custom, Q1, Q2, H1etc.

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  activeFrom?: Date;

  @Column({
    type: 'timestamptz',
    nullable: true,
  })
  activeTo?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

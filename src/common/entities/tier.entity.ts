import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from './project.entity';

export enum ConditionOperator {
  equal = '==',
  notequal = '!=',
  greaterthanorequal = '>=',
  lessthanorequal = '<=',
  greaterthan = '>',
  lessthan = '<',
  contains = '{}',
  doesnotcontains = '!{}',
  in = '()',
  notin = '!()',
  undefined = '<=>',
}

export enum TierConditionOperator {
  And = 'and',
  Or = 'or',
}

export enum TierConditionAttributes {
  TotalPointsEarned = 'TotalPointsEarned',
  TotalPointsSpent = 'TotalPointsSpent',
}

export class TierConditon {
  attribute: TierConditionAttributes;
  combinator: TierConditionOperator;
  operator: ConditionOperator;
  value: number;
  order: number;
}

@Entity('tiers')
export class Tier {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Project, (project) => project.id)
  project: Project;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'jsonb' })
  conditions: TierConditon[];

  @Column({ type: 'boolean' })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

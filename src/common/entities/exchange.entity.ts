import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Project } from './project.entity';

export enum AppliesTo {
  ALL = 'ALL',
  CUSTOMER_TIER = 'CUSTOMER_TIER',
  CUSTOMER_SEGMENT = 'CUSTOMER_SEGMENT',
  CUSTOMER_GROUP = 'CUSTOMER_GROUP',
}

export enum AppliesOn {
  SUBTOTAL = 'SUBTOTAL',
  GRAND_TOTAL = 'GRAND_TOTAL',
  SUBTOTAL_WITH_TAX = 'SUBTOTAL_WITH_TAX',
}

export enum Direction {
  POINTS_TO_CURRENCY = 'POINTS_TO_CURRENCY',
  CURRENCY_TO_POINT = 'CURRENCY_TO_POINT',
}

@Entity()
export class ExchangeRate {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @ManyToOne(() => Project, (project) => project.id)
  project: Project;

  @Column({ type: 'enum', enum: AppliesTo })
  appliesTo: AppliesTo;

  @Column({ type: 'varchar' })
  value: string;

  @Column({ type: 'enum', enum: Direction })
  direction: Direction;

  @Column({ type: 'numeric', default: 0 })
  currency: number;

  @Column({ type: 'numeric', default: 0 })
  point: number;

  @Column({ type: 'enum', enum: AppliesOn })
  appliesOn: AppliesOn;

  @Column({ type: 'boolean' })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

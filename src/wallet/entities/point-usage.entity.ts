import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PointTransaction } from './point-transaction.entity';
import { Point } from './point.entity';

export enum PointState {
  Active = 'active',
  Pending = 'pending',
  Blocked = 'blocked',
  Spent = 'spent',
}

@Entity('pointUsage')
export class PointUsage {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PointTransaction, (pt) => pt.pointsUsed, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'pointTransactionId' })
  pointTransaction: PointTransaction;

  @ManyToOne(() => Point)
  @JoinColumn({ name: 'pointId' })
  point: Point;

  @Column('numeric')
  usage: number;

  @Column('enum', { enum: PointState, default: PointState.Active })
  fromState: PointState;

  @Column('enum', { enum: PointState, default: PointState.Spent })
  toState: PointState;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

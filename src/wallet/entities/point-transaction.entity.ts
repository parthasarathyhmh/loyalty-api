import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PointUsage } from './point-usage.entity';
import { Point } from './point.entity';
import { Wallet } from './wallet.entity';

export enum TransactionType {
  Credit = 'credit',
  Debit = 'debit',
}

export enum TransactionSource {
  Bonus = 'bonus', //                 ManualTransaction     Debit/Credit
  Order = 'order', //                 CheckoutTransaction   Debit
  Coupon = 'coupon', //               RewardTransaction     Debit
  Voucher = 'voucher', //             RewardTransaction     Debit
  Recharge = 'recharge', //           RewardTransaction     Debit
  Reversal = 'reversal', //           CheckoutTransaction   Credit
  Milestone = 'milestone', //         MilestoneTransaction  Credit
  Cart = 'cart', //                   CartTransaction       Credit
  Throughput = 'throughput', //       ThroughputTransaction Credit
}

@Entity('pointTransactions')
export class PointTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('numeric')
  transactionId: number;

  @Column('numeric')
  points: number;

  @Column('varchar', { nullable: true })
  comment: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.id, { nullable: true })
  wallet: Wallet;

  @ManyToOne(() => Point, { nullable: true })
  @JoinColumn({ name: 'pointId' })
  point: Point;

  @OneToMany(() => PointUsage, (usage) => usage.pointTransaction)
  pointsUsed: PointUsage[];

  @Column({ type: 'enum', enum: TransactionType })
  transactionType: TransactionType;

  @Column({ type: 'enum', enum: TransactionSource })
  transactionSource: TransactionSource;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

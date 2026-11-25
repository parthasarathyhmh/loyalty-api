import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../../common/entities/customer.entity';
import { Project } from '../../common/entities/project.entity';
import { Wallet } from '../../wallet/entities/wallet.entity';
import { CustomerReward } from './customer-reward.entity';

@Entity('rewardTransactions')
export class RewardTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Customer, (customer) => customer.id)
  customer: Customer;

  @ManyToOne(() => Project, (project) => project.id)
  project: Project;

  @ManyToOne(() => Wallet, (wallet) => wallet.id)
  wallet: Wallet;

  @ManyToOne(() => CustomerReward, (reward) => reward.id)
  reward: CustomerReward;

  @Column('numeric')
  points: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

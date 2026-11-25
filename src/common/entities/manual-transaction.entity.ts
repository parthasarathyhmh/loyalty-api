import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { TransactionType } from '../../wallet/entities/point-transaction.entity';
import { Wallet } from '../../wallet/entities/wallet.entity';
import { Customer } from './customer.entity';
import { Project } from './project.entity';

@Entity('manualTransactions')
export class ManualTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Project, (project) => project.id)
  project: Project;

  @ManyToOne(() => Customer, (customer) => customer.id)
  customer: Customer;

  @ManyToOne(() => Wallet, (wallet) => wallet.id)
  wallet: Wallet;

  @Column('numeric')
  points: number;

  @Column('enum', { enum: TransactionType, default: TransactionType.Credit })
  type: TransactionType;

  @Column('numeric')
  reasonId: number;

  @Column('varchar')
  reason: string;

  @Column('varchar')
  reasonCode: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

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
import { TransactionType } from '../../wallet/entities/point-transaction.entity';
import { Wallet } from '../../wallet/entities/wallet.entity';

@Entity('cartTransactions')
export class CartTransaction {
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

  @Column({ type: 'varchar', length: 64 })
  magentoOrderId: string;

  @Column({ type: 'varchar', length: 64 })
  hsfOrderId: string;

  @Column('enum', { enum: TransactionType, default: TransactionType.Credit })
  type: TransactionType;

  @Column('boolean', { default: false })
  processed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

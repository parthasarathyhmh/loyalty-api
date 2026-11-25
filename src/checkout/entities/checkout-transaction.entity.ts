import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Customer } from '../../common/entities/customer.entity';
import { Project } from '../../common/entities/project.entity';
import { PointTransaction } from '../../wallet/entities/point-transaction.entity';
import { Wallet } from '../../wallet/entities/wallet.entity';

@Entity('checkoutTransactions')
export class CheckoutTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Customer, (customer) => customer.id)
  customer: Customer;

  @ManyToOne(() => Project, (project) => project.id)
  project: Project;

  @ManyToOne(() => Wallet, (wallet) => wallet.id)
  wallet: Wallet;

  @OneToOne(() => PointTransaction, (txn) => txn.id, { nullable: true })
  @JoinColumn()
  pointTransaction: PointTransaction;

  @Column('numeric')
  points: number;

  @Column('numeric')
  discount: number;

  @Column('varchar')
  cartId: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  magentoOrderId: string;

  @Column({ type: 'varchar', length: 64, nullable: true })
  hsfOrderId: string;

  @Column('boolean')
  pending: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
